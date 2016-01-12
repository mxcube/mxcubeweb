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
        proxy: {
            '/mxcube/api/*': {
                target: backend_server
            },
            '/socket.io/*': {
                target: backend_server,
                ws: true
            },
        },
    },
    module: {
        preLoaders: [
            {
                test: /(\.js$|\.jsx$)/,
                exclude: /node_modules/,
                loader: "eslint-loader"
            }
        ],
        loaders: [
            {
                test: /isotope-layout/,
                loader: 'imports?define=>false&this=>window'
            },
            {  
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loaders: ['react-hot', 'babel']
            },
            {
                test: /\.(jpe?g|png|gif)$/i,
                loaders: [
                    'url?limit=8192',
                    'img'
                ]
            },
            {
                test: /isotope\-|fizzy\-ui\-utils|desandro\-|masonry|outlayer|get\-size|doc\-ready|eventie|eventemitter|classie|get\-style\-property|packery/,
                loader: 'imports?define=>false&this=>window'
            },
            { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
            { test: /\.less$/, loader: "style-loader!css-loader!less-loader"}

        ]
    },
    eslint: {
        configFile: '.eslintrc'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        })
    ],
    resolve: {
        root: path.resolve(__dirname, 'mxcube3/ui'), 
        extensions: ['', '.js', '.jsx']
    },
}

module.exports = config;

