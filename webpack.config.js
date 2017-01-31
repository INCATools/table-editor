var webpack = require('webpack');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var path = require('path');
var dist = path.join(__dirname, 'docs');
var src = path.join(__dirname, 'src');
var bs = path.join(__dirname, 'node_modules/bootstrap');
var uigrid = path.join(__dirname, 'node_modules/angular-ui-grid');

var production = process.env.BUILD === 'production';

var config = {
  entry: path.join(src, 'app.js'),
  output: {
    path: dist,
    filename: "table-editor.js"
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        // Reference: https://github.com/babel/babel-loader
        test: /\.js$/,
        loader: 'babel',
        query: {
            // https://github.com/babel/babel-loader#options
            cacheDirectory: true,
            presets: ['es2015']
        },
        exclude: /node_modules/,
        include: [src]
      },

      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|txt|ico)$/,
        loader: 'file',
        include: [bs, uigrid]
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  devServer: {
    inline: false,
    contentBase: dist
  },
  plugins: [
    new CopyWebpackPlugin([
        { from: 'README.md' },
        { from: 'examples', to: 'examples' }
    ]),

    new HtmlWebpackPlugin({
      template: path.join(src, 'index.html'),
      inject: 'head',
      baseUrl: '/'
    })
  ]
};

if (production) {
  config.plugins.push(
    // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
    // Minify all javascript, switch loaders to minimizing mode
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      // mangle: false,
      mangle: {
        // except: ['$', '$scope', '$compile', '$timeout', '$rootScope', '$http',
        //           '$rootScopeProvider',
        //           '$location', '$state', '$q']
      },
      compress: {
        warnings: false
      }
    })
  );
}

module.exports = config;
