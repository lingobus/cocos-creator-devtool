(function () {
  console.log('cc-devtool-backgroundScript.js');
  chrome.extension.onConnect.addListener(function (port) {
    function extensionListener (message, sender, sendResponse) {
      if (message.tabId && message.content) {
        const act = message.action;
        if (act === 'code') {
          chrome.tabs.executeScript(message.tabId, {code: message.content});
        } else if (act === 'script') {
          chrome.tabs.executeScript(message.tabId, {file: message.content});
        } else {
          chrome.tabs.sendMessage(message.tabId, message, sendResponse);
        }

      } else {
        port.postMessage(message);
      }
      sendResponse(message);
    }

    chrome.extension.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(port => chrome.extension.onMessage.removeListener(extensionListener));
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => true);
})();