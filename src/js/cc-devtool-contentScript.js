window.addEventListener('message', e => {
  /**
   * Can not access window.cc from content script
   * if canvas#GameCanvas or any canvas with id containing `cc-game` exists,
   * we assume that Cocos runtime is avaiable
   */
  let hasCocosGameCanvas = !!document.querySelector('#GameCanvas');
  if (!hasCocosGameCanvas) {
    const nodes = [].slice.call(document.querySelectorAll('canvas'));
    if (nodes.length > 0) {
      hasCocosGameCanvas = nodes.find(function (node) {
        return node.id && node.id.indexOf('cc-game') >= 0;
      })
    }
  }
  if (e.source === window && hasCocosGameCanvas) {
    chrome.runtime.sendMessage(e.data);
  }
});