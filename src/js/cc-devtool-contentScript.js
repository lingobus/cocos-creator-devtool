// this script runs in the context of page being inspected
(function () {
  window.addEventListener('message', e => {
    if (e.source === window && e.data.isCocosGame) {
      chrome.extension.sendMessage(e.data);
    }
  });
  chrome.extension.sendMessage({isCocosGame: !!document.querySelector('#GameCanvas')});
})();