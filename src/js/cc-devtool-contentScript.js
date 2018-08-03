// this script runs in the context of page being inspected
(function () {
  const isCocosGame = _ => !!document.querySelector('#GameCanvas') && typeof window.cc !== 'undefined';
  window.addEventListener('message', e => {
    if (e.source === window && isCocosGame()) {
      chrome.extension.sendMessage(e.data);
    }
  });
})();