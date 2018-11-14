var webpack = require("webpack");
var path = require('path');
var backend_server = require('./backend_server.js');
var GitRevisionPlugin = require('git-revision-webpack-plugin');
var gitRevisionPlugin = new GitRevisionPlugin();
var CopyWebpackPlugin = require('copy-webpack-plugin')

var VIDEO_STREAM_URL = '"ws://localhost:4042/"'

try {
  VIDEO_STREAM_URL = JSON.stringify(require('./config.video_url.dev.js'));
} catch (e) {
  console.log("WARNING: VIDEO_STREAM_URL not set");
}

var config = {
  entry: {
    main: ['main.jsx'],
  },
  output: {
    path: path.resolve(__dirname, 'mxcube3','static'),
    filename: '[name].js', 
    publicPath: '' 
  },
  devServer: {
    compress: true,
    port: 8090,
    host: "0.0.0.0",
    disableHostCheck: true,
    contentBase: path.join(__dirname, "mxcube3/ui"),
    historyApiFallback: true,
    proxy: {
      '/mxcube/api/*': {
        target: backend_server,
	      xfwd: true
      },
      '/socket.io/*': {
        target: backend_server,
        ws: true,
	      xfwd: true
      },
    },
  },
  module: {
    rules: [
      {
	test: /\.jsx?$/,
	exclude: /node_modules/,
	use:[
          "babel-loader",
          "eslint-loader"
        ]
      },
      {  
	test: /\.css$/,
        use: [
          {
	    loader: "style-loader"
          },
          {
            loader: "css-loader",
            options: {
              modules: false
            }
          }
        ]
      },
      {
	test: /\.less$/,
        use: [
          {
	    loader: "style-loader"
          },
          { loader: "css-loader", 
            options: { 
              importLoaders: "1" 
            } 
          },
          {
            loader: "less-loader"
          }
        ]
      },
      { 
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=[a-z0-9]\.[a-z0-9]\.[a-z0-9])?$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.(gif|png|jpe?g|svg|ico)$/i,
        loaders: [
          'file-loader', {
            loader: 'image-webpack-loader',
            options: {
              gifsicle: {
                enabled: false,
                interlaced: false,
              },
              optipng: {
                enabled: false,
                optimizationLevel: 7,
              },
              pngquant: {
                enabled: false,
                quality: '65-90',
                speed: 4
              },
              mozjpeg: {
                progressive: true,
                quality: 65
              }
            }
          }
        ]
      },
      {
        test: /\.(ogv)$/,
        use: [
               {
                 loader: 'file-loader',
                 options: {}
	       }
             ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': '"dev"'
      },
      'VERSION': { 'COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
                   'BRANCH': JSON.stringify(gitRevisionPlugin.branch()) },
      'VIDEO_STREAM_URL': VIDEO_STREAM_URL,
      'VIDEO_STREAM_ON_LOCAL_HOST': true
    }),
   new CopyWebpackPlugin([
       { from: 'mxcube3/ui/img/favicon.ico' },
   ])
  ],
  externals: {
    'guiConfig': JSON.stringify(require('./config.gui.prod.js')),
  },
  resolve: {
    modules: [ path.join(__dirname, "mxcube3/ui"), "node_modules" ],
    extensions: ['.js', '.jsx']
  }
}

module.exports = config;
