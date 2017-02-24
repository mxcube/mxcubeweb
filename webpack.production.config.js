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

    module: {
    loaders: [
        {  
        test: /\.css$/,
        loader: "style-loader!css-loader"
        },
        {
        test: /\.less$/,
        loader: "style!css!less"
        },
        {
        test: /\.jsx?$/,
        loaders: ['react-hot', 'babel-loader?presets[]=react,presets[]=es2015,presets[]=stage-0,plugins[]=transform-decorators-legacy'],
        exclude: /node_modules/
        },
        {test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff" },
        {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
        {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
        {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
        {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
            'file?hash=sha512&digest=hex&name=[hash].[ext]',
            'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
        },
    ]
    },
    plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': '"production"'
        }
    })
    ],
    externals: {
      'guiConfig': JSON.stringify(require('./config.gui.prod.js'))
    },
  resolve: {
    modules: [ path.join(__dirname, "mxcube3/ui"), "node_modules" ],
    extensions: ['', '.js', '.jsx']
  },
}

module.exports = config;
