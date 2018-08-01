/* eslint-disable */
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import App from './App.vue'
import routes from './_routes.js'
import modules from './store'

/* eslint-disable no-new */
const router = new VueRouter({
  routes,
  mode: 'history',
  scrollBehavior: function(to, from, savedPosition) {
      if (to.hash) {
          return {selector: to.hash}
      } else {
          return { x: 0, y: 0 }
      }
  },
  saveScrollPosition: true
})

// vuex
const store = new Vuex.Store({
  modules
})

const app = new Vue({
  store,
  router,
  el: '#root',
  render: h => h(App)
})
