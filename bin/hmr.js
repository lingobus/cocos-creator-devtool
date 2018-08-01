var webpack = require('webpack')
var colors = require('colors')
var webpackConfigs = require('./webpack.dev.conf.js')
var utils = require('./utils.js')
var config = require('./config.js')
module.exports = function (app, staticPath) {
    // utils.safeRm(staticPath)
    // utils.safeRm(config.paths.views)
    [webpackConfigs[0]].forEach(function (c) {
      c.stats = 'normal'
      Object.keys(c.entry).forEach(function (name) {
        c.entry[name] = ['./bin/dev-client.js'].concat(c.entry[name])
      })
      c.plugins.push(
        new webpack.HotModuleReplacementPlugin({
          multiStep: !!process.env.MULTISTEP
        }),
        new webpack.NoEmitOnErrorsPlugin()
      )

      var compiler = webpack(c)
      app.use(require("webpack-dev-middleware")(compiler, {
        noInfo: false,
        publicPath: '/static/',
        stats: {
          colors: true,
          chunks: false
        }
      }));

      var hotMiddleware = require('webpack-hot-middleware')(compiler, {
        log: console.log,
        heartBeat: 5 * 1000
      })
      app.use(hotMiddleware)

      compiler.plugin('compilation', function (compilation) {
        compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
          hotMiddleware.publish({ action: 'reload' })
          cb()
        })
      })
    })
    console.log(`WEBPACK=${String(process.env.WEBPACK)}`)
    if (String(process.env.WEBPACK) === 'js') {
      console.log('Only compile js'.red.bold)
    } else {
      webpack(webpackConfigs.slice(1), function (err, stats) {
        if (err) {
          console.error(err.stack || err)
          if (err.details) {
            console.error(err.details)
          }
        } else {
          process.stdout.write(stats.toString('normal') + '\n\n')
        }
      })
    }
}
