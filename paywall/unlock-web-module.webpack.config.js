/* eslint no-console: 0 */
const dotenv = require('dotenv')
var path = require('path')
const webpack = require('webpack')

const unlockEnv = process.env.UNLOCK_ENV || 'dev'
const debug = process.env.DEBUG ? 1 : 0

dotenv.config({
  path: path.resolve(__dirname, '..', `.env.${unlockEnv}.local`),
})

const requiredConfigVariables = {
  unlockEnv,
  paywallUrl: process.env.PAYWALL_URL,
  usersIframeUrl: process.env.USER_IFRAME_URL,
}

Object.keys(requiredConfigVariables).forEach(configVariableName => {
  if (!requiredConfigVariables[configVariableName]) {
    if (['dev', 'test'].indexOf(requiredConfigVariables.unlockEnv) > -1) {
      return console.error(
        `The configuration variable ${configVariableName} is falsy.`
      )
    }
    throw new Error(
      `The configuration variable ${configVariableName} is falsy.`
    )
  }
})

module.exports = () => {
  return {
    cache: false,
    mode: 'none',
    devtool: 'source-map',
    entry: path.resolve(__dirname, 'src', 'unlock.js', 'module.ts'),
    output: {
      library: 'unlock-web',
      libraryTarget: 'commonjs2',
      path: path.resolve(__dirname, 'src', 'unlock.js', 'dist'),
      filename: 'index.js',
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: 'style-loader', options: { injectType: 'lazyStyleTag' } },
            'css-loader',
          ],
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.UNLOCK_ENV': "'" + unlockEnv + "'",
        'process.env.DEBUG': debug,
        'process.env.PAYWALL_URL':
          "'" + requiredConfigVariables.paywallUrl + "'",
        'process.env.USER_IFRAME_URL':
          "'" + requiredConfigVariables.usersIframeUrl + "'",
      }),
    ],
  }
}
