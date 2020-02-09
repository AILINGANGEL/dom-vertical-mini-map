const path = require('path')
const BaseConfig = require('./webpack.base.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const merge = require('webpack-merge')
module.exports = merge(BaseConfig, {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, '../examples/index.js')
  },
  output: {
    publicPath: '/'
  },
  devServer: {
    contentBase: '.',
    publicPath: '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      hash: true,
      template: './examples/index.html',
      filename: './index.html'
    })
  ]
})
