/* eslint-disable */
import Vue from 'vue'
// import Vuex from 'vuex'
import App from './Popup.vue'
import modules from './store'

// vuex
// const store = new Vuex.Store({
//   modules
// })

const app = new Vue({
  el: '#root',
  render: h => h(App)
})
