var webpack = require('webpack');
var _ = require('lodash');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var path = require('path');

var nodeEnvironment = process.env.BUILD || 'production';
var dist = path.join(__dirname, 'dist');
var app = path.join(__dirname, 'app');
var bs = path.join(__dirname, 'node_modules/bootstrap');
var bss = path.join(__dirname, 'node_modules/bootstrap-sass');
var uigrid = path.join(__dirname, 'node_modules/angular-ui-grid');
var fa = path.resolve(__dirname, 'node_modules/font-awesome');

var production = process.env.BUILD === 'production';
var lproduction = process.env.BUILD === 'lproduction';
var debugMode = !production && !lproduction;

console.log('production', production);
console.log('debugMode', debugMode);

var entryFile = './app.js';
var outputPath = dist;
var outputFile = './bundle.js';
var indexFile = 'index.ejs';
var baseURL = (production || lproduction) ? '/table-editor/' : '/';

var config = {
  mode: (production || lproduction) ? 'production' : 'development',
  context: app,

  entry: entryFile,

  output: {
    path: outputPath,
    filename: outputFile,
    publicPath: production ? /* eslint no-nested-ternary: 0 */
                  '/table-editor/' :
                  (lproduction ?
                    '/table-editor/' :
                    '/')
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
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2, // 0 => no loaders (default); 1 => postcss-loader; 2 => postcss-loader, sass-loader
            },
          },
          'postcss-loader',
          'sass-loader',
        ],

        // // loader: 'style!css!sass?includePaths[]=' + bootstrap
        // loaders: [
        //   'style-loader',
        //   'css-loader?importLoaders=2',
        //   'postcss-loader',
        //   'sass-loader'
        // ]
      },

      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        // Reference: https://github.com/babel/babel-loader
        test: /\.js$/,
        exclude: /node_modules/,
        include: [app],
        use: {
          loader: 'babel-loader',
          options: {
            comments: true,
            cacheDirectory: false,
            presets: ['@babel/preset-env'],
            plugins: [
            ]
          },
        },
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
    open: true,
    inline: true,
    contentBase: dist,
    watchContentBase: true,
    historyApiFallback: true,
   headers: { "Access-Control-Allow-Origin": "*" }
  },
};

config.plugins.push(
  new CopyWebpackPlugin([
      { from: 'widgets/navbar/INCA.png' },
      { from: '../README.md' },
      { from: '../output/configurations', to: 'configurations' }
  ]));

config.plugins.push(
  new HtmlWebpackPlugin({
    template: path.join(app, indexFile),
    inject: 'head',
    baseURL: baseURL
  }));

switch (nodeEnvironment) {
  /* eslint no-fallthrough: 0 */
  case 'lproduction':
  case 'production':
    if (!debugMode) {
      config.plugins.push(
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false
        })
      );

      config.optimization = {
        minimizer: [
          new UglifyJSPlugin({
            include: [app],
            sourceMap: true
          })
        ]
      };
    }

    // config.plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'vendor', minChunks: Infinity}));

    config.output.filename = '[name].js';

    config.entry = {
      bundle: entryFile,
      // vendor: ['angular', 'angular-ui-router', 'lodash']
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
