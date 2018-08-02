// this script runs in the context of devtool.html which is embeded as a iframe in Chrome devtools tab
chrome.devtools.inspectedWindow.eval('!!window.cc && !!window.cc.game', hasCC => {
  if (hasCC) createCocosCreatorDevtoolPanel();
});

const tabTitle = "Cocos Creator Devtool"
const icon = "img/icon-default.png"
const html = "html/devtool.html"

function createCocosCreatorDevtoolPanel () {
  chrome.devtools.panels.create(tabTitle, icon, html, panel => {
    'Shown,Hidden,Search'.split(',').forEach(event => {
      panel['on' + event].addListener(function (arg1, arg2) {
        console.log('[cc-devtool]:' + event, arg1, arg2);
        chrome.runtime.sendMessage('cc-devtool-' + event.toLowerCase())
        if (arg2) return false;
      })
    })
  });
}

/* eslint-disable */
import Vue from 'vue'
// import Vuex from 'vuex'
import App from './Devtool.vue'

// vuex
// const store = new Vuex.Store({
//   modules
// })

const app = new Vue({
  el: '#root',
  render: h => h(App)
})
