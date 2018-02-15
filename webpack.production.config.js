var webpack = require("webpack");
var path = require('path');
var backend_server = require('./backend_server.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var config = {
    entry: {
        main: ['main.jsx'],
    },
    output: {
        path: path.resolve(__dirname, 'mxcube3','static'),
        filename: '[name].js', 
        publicPath: '' 
    },
    module: {
    rules: [
      {
	test: /\.jsx?$/,
	exclude: /node_modules\/(?!(dygraphs)\/).*/,
	use:[
          "babel-loader"
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
        test: /\.(gif|png|jpe?g|svg)$/i,
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
        'NODE_ENV': '"production"'
      }
    }),
    new UglifyJSPlugin()
  ],
  externals: {
    'guiConfig': JSON.stringify(require('./config.gui.prod.js'))
  },
  resolve: {
    modules: [ path.join(__dirname, "mxcube3/ui"), "node_modules" ],
    extensions: ['.js', '.jsx']
  },
}

module.exports = config;


