import log from 'utils/logger.js'

log('cc-devtool-backgroundScript.js');
// chrome.extension.onConnect.addListener(function (port) {
//   function extensionListener (message, sender, sendResponse) {
//     if (message.tabId && message.content) {
//       const act = message.action;
//       if (act === 'code') {
//         chrome.tabs.executeScript(message.tabId, {code: message.content});
//       } else if (act === 'script') {
//         chrome.tabs.executeScript(message.tabId, {file: message.content});
//       } else {
//         chrome.tabs.sendMessage(message.tabId, message, sendResponse);
//       }

//     } else {
//       port.postMessage(message);
//     }
//     sendResponse(message);
//   }

//   chrome.extension.onMessage.addListener(extensionListener);

//   port.onDisconnect.addListener(port => chrome.extension.onMessage.removeListener(extensionListener));
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => true);

var panelConnections = {};

chrome.runtime.onConnect.addListener(function(panelConnection) {
  var onMessage = function(message, sender, sendResponse) {
    log('Received message', message)

    if (message.name == "panelPageCreated") {
      log('Creating connection for #tab ' + message.tabId)
      panelConnections[message.tabId] = panelConnection;
      return;
    } else {
      assert(false, 'Unknown message', message.name)
    }
  }

  panelConnection.onMessage.addListener(onMessage);

  panelConnection.onDisconnect.addListener(function(panelConnection) {
    panelConnection.onMessage.removeListener(onMessage);

    // remove the connection from the list
    var tabs = Object.keys(panelConnections);
    for (var i = 0, len = tabs.length; i < len; i++) {
      if (panelConnections[tabs[i]] == panelConnection) {
        log('Deleting connection for tabId', tabs[i])
        delete panelConnections[tabs[i]]
        break;
      }
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    var tabId = sender.tab.id;
    if (tabId in panelConnections) {
      panelConnections[tabId].postMessage(request);
    } else {
      log("Tab not found in connection list.");
    }
  }
  return true;
});

chrome.webNavigation.onCompleted.addListener(function(data) {
  if (panelConnections[data.tabId]) {
    log('Found connection', panelConnections[ data.tabId ])
    if (data.frameId === 0) {
      log('FrameId', data.frameId)
      panelConnections[data.tabId].postMessage({
        type: 'inspectedWinReloaded'
      });
    }
  }
});
