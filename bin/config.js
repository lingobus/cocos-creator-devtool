// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')
var prettyjson = require('prettyjson')
var colors = require('colors')
var buildPath = '../build'

const envconfigs = {
  paths: {
    root: path.resolve(__dirname, '..'),
    src: path.resolve(__dirname, '../src'),
    build: path.resolve(__dirname, buildPath),
    views: path.resolve(__dirname, '../views')
  },
  externals: {
    vue: 'Vue'
  },
  alias: {
    '@': path.resolve(__dirname, '../src'),
    "pages": path.resolve(__dirname, '../src/js/pages'),
    "components": path.resolve(__dirname, '../src/js/components'),
    "api": path.resolve(__dirname, '../src/js/api'),
    "utils": path.resolve(__dirname, '../src/js/utils'),
    "store": path.resolve(__dirname, '../src/js/store')
  },
  prod: {
    env: {
      NODE_ENV: '"production"'
    },
    port: 8080,
    assetsRoot: path.resolve(__dirname, buildPath, 'prod'),
    assetsPublicPath: '../'
  },
  dev: {
    env: {
      NODE_ENV: '"development"'
    },
    port: 8080,
    assetsRoot: path.resolve(__dirname, buildPath, 'dev'),
    assetsPublicPath: '../',
  }
}
const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
console.log('Enviroment Configuration:'.magenta.bold)
console.log(prettyjson.render(envconfigs[env]))
module.exports = envconfigs
