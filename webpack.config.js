const path = require("path")
const webpack = require('webpack'); // Importar o webpack
const dotenv = require('dotenv');

// Carrega as variáveis do arquivo .env
const env = dotenv.config().parsed || {};

// Cria um objeto para o DefinePlugin, garantindo que os valores sejam strings
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
    entry: {
        app: './src/app.js',
        'pdf.worker': 'pdfjs-dist/build/pdf.worker.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin(envKeys) // Adiciona o DefinePlugin
    ],
    devServer: {
    contentBase: path.join(__dirname, './'),
        publicPath: '/dist/',
        port: 8081,
    host: 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
    }
} 
   
