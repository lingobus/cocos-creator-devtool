import log from 'utils/logger.js'

log('cc-devtool-backgroundScript.js loaded!');

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
  if (sender.tab) {
    var tabId = sender.tab.id, not = '';
    if (tabId in panelConnections) {
      panelConnections[tabId].postMessage(request);
    } else {
      not = '-not'
      log("Tab not found in connection list.");
    }
    if (request.type === ':cc-found') {
      chrome.browserAction.setPopup({
        tabId: sender.tab.id,
        popup: `html/popup${not}-found.html`
      })
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
        type: ':inspectedWinReloaded'
      });
    }
  }
});
