var env = process.env.NODE_ENV == 'development' ? 'dev' : 'prod'

var path = require('path')
var colors = require('colors')
var ora = require('ora')

var webpack = require('webpack')
var utils = require('./utils.js')
var config = require('./config')
var pkg = require('../package.json')
var webpackConfigs = require('./webpack.' + env + '.conf')
var assetsRoot = config[env].assetsRoot
var safeRm = utils.safeRm

// safeRm(assetsRoot)
// safeRm(config.paths.views)
if (env === 'dev') {
  const wp = process.env.WEBPACK
  if (wp == 'css,html') {
    console.log(`Only Compile css,html`.red.bold)
    webpack(webpackConfigs.slice(1), webpackCallback)
  } else {
    console.log('Compile js,css,html'.red.bold)
    webpack(webpackConfigs, webpackCallback)
  }
} else {
  var js = webpackConfigs[0]
  var stylus = webpackConfigs[1]
  var jade = webpackConfigs[2]
  var spinner1 = ora('Building ' + js.name + ' and ' + stylus.name)
  var spinner2 = ora('Building ' + jade.name)
  spinner1.start()
  webpack([js, stylus], function (err, stats) {
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details)
      }
    } else {
      spinner1.stop()
      process.stdout.write(stats.toString('normal') + '\n\n')

      spinner2.start()
      webpack(jade, function (err, stats) {
        if (err) {
          console.error(err.stack || err)
          if (err.details) {
            console.error(err.details)
          }
        } else {
          spinner2.stop()
          process.stdout.write(stats.toString('normal') + '\n\n')
        }
      })
    }
  })
}

function webpackCallback (err, stats) {
  if (err) {
    console.error(err.stack || err)
    if (err.details) {
      console.error(err.details)
    }
  } else {
    process.stdout.write(stats.toString('normal') + '\n\n')
  }
}
