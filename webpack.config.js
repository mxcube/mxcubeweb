var webpack = require("webpack");
var path = require('path');
var backend_server = require('./backend_server.js');

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
    contentBase: path.join(__dirname, "mxcube3/ui"),
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
		    test: /\.js/,
		    exclude: /node_modules/,
        enforce: "pre",
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
        test: /\.jsx$/,
        loader: "babel-loader",
		    exclude: /node_modules/
      },
      { 
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=[a-z0-9]\.[a-z0-9]\.[a-z0-9])?$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
          'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
      }
	  ]
  },
  externals: {
    'guiConfig': JSON.stringify(require('./config.gui.prod.js'))
  },
  resolve: {
    modules: [ path.join(__dirname, "mxcube3/ui"), "node_modules" ],
    extensions: ['.js', '.jsx']
  },
}

module.exports = config;


