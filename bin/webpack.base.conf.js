var webpack = require('webpack')
var path = require('path')
var colors = require('colors')
var utils = require('./utils.js')
var config = require('./config.js')
var pkg = require('../package.json')

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader')
const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
const mode = env == 'dev' ? 'development' : 'production';
const configs = []
const imageLoader = utils.getImageLoader(env)
const fontLoader = utils.getFontsLoader(env)
// const lessLoader = utils.getLessLoader(env)
const vueLoader = utils.getVueLoader(env)

const jsLoader = utils.getJsLoader(/\.jsx?$/, {
  exclude: /node_modules/,
  include: config.paths.src,
  query: {
    cacheDirectory: path.resolve(config.paths.build, 'tmp')
  }
})


var stylusLoader = utils.getStylusLoaderMaybeWithPlugin(false, env)
configs.push({
  name: ' JavaScript '.yellow.bold.inverse,
  mode,
  target: 'web',
  context: config.paths.root,
  output: {
    path: config[env].assetsRoot,
    filename: env == 'dev' ? '[name].js' : '[name].js',
    publicPath: config[env].assetsPublicPath
  },
  entry: utils.getEntries(['.js'], {
    includes: process.env.WEBPACKINCLUDES,
    excludes: process.env.WEBPACKEXCLUDES
  }),
  resolve: {
    extensions: ['.js'],
    alias: config.alias
  },
  module: {
    rules: [{
      test: /\.css$/,
      loader: "style-loader!css-loader"
    },imageLoader, fontLoader, jsLoader, vueLoader, stylusLoader, {
      test: /\.pug$/,
      loader: 'pug-plain-loader'
    }]
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    utils.getCopyPlugins(env, config[env].assetsPublicPath)
  ]
})

//stylus
var stylusLoaderAndPlugins = utils.getStylusLoaderMaybeWithPlugin(true, env)
configs.push({
  name: ' Stylesheet '.cyan.bold.inverse,
  mode,
  target: 'web',
  context: config.paths.root,
  entry: utils.getEntries(['.styl']),
  output: {
    path: config[env].assetsRoot,
    filename: env == 'dev' ? '[name].css' : '[name].css',
    publicPath: config.dev.assetsPublicPath
  },
  resolve: {
    modules: ["node_modules"]
  },
  module: {
    rules: [imageLoader, fontLoader, stylusLoaderAndPlugins.loader]
  },
  plugins: stylusLoaderAndPlugins.plugins
})

// jade
const jadeLoaderAndPlugins = utils.getJadeLoaderPluginMaybeWithPlugin(true, env)
console.log(config.paths)
configs.push({
  name: ' Jade '.magenta.bold.inverse,
  mode,
  target: 'node',
  context: config.paths.root,
  entry: utils.getEntries(['.jade'], {
    noskip: true,
    verbose: true,
    baseDir: path.join(config.paths.src, 'html')
  }),
  output: {
    path: path.resolve(config[env].assetsRoot, 'html'),
    filename: '[name].delete',
    publicPath: config[env].assetsPublicPath
  },
  module: {
    rules: [stylusLoaderAndPlugins.loader,imageLoader, fontLoader, jadeLoaderAndPlugins.loader]
  },
  plugins: jadeLoaderAndPlugins.plugins
})

module.exports = configs
