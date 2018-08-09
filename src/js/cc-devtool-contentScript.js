window.addEventListener('message', e => {
  /**
   * Can not access window.cc from content script
   * if #GameCanvas exists, we assume that Cocos runtime is avaiable
   */
  if (e.source === window && !!document.querySelector('#GameCanvas')) {
    chrome.runtime.sendMessage(e.data);
  }
});