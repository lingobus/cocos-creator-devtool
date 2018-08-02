var webpack = require('webpack')
var utils = require('./utils.js')
var merge = require('webpack-merge')
var config = require('./config.js')
var baseWebpackConfigs = require('./webpack.base.conf')

var wpconfig = {
  devtool: '#inline-source-map',
  externals: config.externals,
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  }
}

baseWebpackConfigs.forEach(function (c) {
  var plugins = utils.getWebpackDevHelperPlugins(c.name)
  if (typeof c.plugins == 'undefined') {
    c.plugins = plugins
  } else {
    c.plugins = c.plugins.concat(plugins)
  }
})

baseWebpackConfigs[0] = merge(baseWebpackConfigs[0], wpconfig)
baseWebpackConfigs[1].watch = true
baseWebpackConfigs[2].watch = true
module.exports = baseWebpackConfigs
