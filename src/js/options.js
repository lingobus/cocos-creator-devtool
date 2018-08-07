/* eslint-disable */
import Vue from 'vue'
// import Vuex from 'vuex'
import App from './components/Options.vue'

// vuex
// const store = new Vuex.Store({
//   modules
// })

const app = new Vue({
  el: '#root',
  render: h => h(App)
})
