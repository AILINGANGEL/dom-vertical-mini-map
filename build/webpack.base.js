const path = require('path')
const DefinePlugin = require('webpack').DefinePlugin
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: {
    'dom-vertical-mini-map': path.resolve(__dirname, '../src/index.js')
  },
  resolve: {
    extensions: [
      '.js'
    ],
    alias: {
      'dom-vertical-mini-map': path.join(__dirname, 'dist', 'dom-vertical-mini-map')
    }
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'dom-vertical-mini-map.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.join(__dirname, 'src')
        ],
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        use: [ MiniCssExtractPlugin.loader,
          'css-loader']
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      VERSION: JSON.stringify(require('../package.json').version)
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ]
}
