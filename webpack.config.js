var webpack = require('webpack');
var _ = require('lodash');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackBrowserPlugin = require('webpack-browser-plugin');
var path = require('path');

var nodeEnvironment = process.env.BUILD;
var dist = path.join(__dirname, 'docs');
var app = path.join(__dirname, 'app');
var bs = path.join(__dirname, 'node_modules/bootstrap');
var bss = path.join(__dirname, 'node_modules/bootstrap-sass');
var uigrid = path.join(__dirname, 'node_modules/angular-ui-grid');
var fa = path.resolve(__dirname, 'node_modules/font-awesome');

var production = process.env.BUILD === 'production';
var debugMode = !production;

console.log('production', production);
console.log('debugMode', debugMode);

var entryFile = './app.js';
var outputPath = dist;
var outputFile = './bundle.js';
var indexFile = 'index.ejs';
var baseURL = production ? '/table-editor/' : '/';

var config = {
  context: app,

  entry: entryFile,

  output: {
    path: outputPath,
    filename: outputFile,
    publicPath: production ?
                  'https://incatools.github.io/table-editor/' :
                  'http://127.0.0.1:8085/'
  },

  resolve: {
    modules: [
      app,
      'node_modules'
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),

    new webpack.DefinePlugin({
      'INCLUDE_ALL_MODULES': function includeAllModulesGlobalFn(modulesArray, application) {
        modulesArray.forEach(function executeModuleIncludesFn(moduleFn) {
            moduleFn(application);
        });
      },
      ENVIRONMENT: JSON.stringify(nodeEnvironment)
    })
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },

      {
        test: /\.scss$/,
        // loader: 'style!css!sass?includePaths[]=' + bootstrap
        loaders: [
          'style-loader',
          'css-loader?importLoaders=1',
          'postcss-loader',
          'sass-loader'
        ]
      },

      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        // Reference: https://github.com/babel/babel-loader
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
            // https://github.com/babel/babel-loader#options
            cacheDirectory: true,
            presets: ['env']
        },
        exclude: /node_modules/,
        include: [app]
      },

      {
        test: /\.(png|jpg|jpeg|gif|ico)$/,
        loader: 'file-loader',
        include: [bs, bss, uigrid, app]
      },


      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000',
        include: [fa, bs, bss, uigrid]
      },

      {
        test: /\.(html)$/,
        loader: 'html-loader',
        exclude: /node_modules/
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  devServer: {
    hot: false,
    inline: true,
    contentBase: dist,
    watchContentBase: true,
    historyApiFallback: true,
   headers: { "Access-Control-Allow-Origin": "*" }
  },
};

if (!production) {
  config.plugins.push(
    new WebpackBrowserPlugin({
      browser: 'Safari'   // 'Firefox'
    })
  );
}
config.plugins.push(
  new CopyWebpackPlugin([
      { from: 'widgets/navbar/INCA.png' },
      { from: '../README.md' },
      { from: '../configurations', to: 'configurations' }
  ]));

config.plugins.push(
  new HtmlWebpackPlugin({
    template: path.join(app, indexFile),
    inject: 'head',
    baseURL: baseURL
  }));

switch (nodeEnvironment) {
  case 'production':
    if (!debugMode) {
      config.plugins.push(
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false
        }),
        new webpack.optimize.UglifyJsPlugin({
          sourceMap: false,
          beautify: false,
          mangle: {
            screw_ie8: true,
            keep_fnames: true
          },
          compress: {
            warnings: true,
            screw_ie8: true
          },
          comments: false
        })
      );
    }

    config.plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'vendor', minChunks: Infinity}));

    config.output.filename = '[name].js';

    config.entry = {
      bundle: entryFile,
      vendor: ['angular', 'angular-ui-router', 'lodash']
    };
    config.devtool = 'source-map';
    break;

  case 'test':
    config.entry = entryFile;
    break;

  case 'development':
    config.entry = [entryFile, 'webpack/hot/dev-server'];
    config.devtool = 'source-map';
    break;

  default:
    console.warn('Unknown or Undefined Node Environment. Please refer to package.json for available build commands.');
}

module.exports = config;
