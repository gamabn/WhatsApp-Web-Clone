const path = require("path")
module.exports = {
    entry: {
        // app: './src/index.js',
        app: './src/app.js',
        'pdf.worker': 'pdfjs-dist/build/pdf.worker.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, '/dist'),
        publicPath: 'dist'
    },
    module: {
        rules: [
            {
                test: /\.m?js$/, // Aplica a regra para arquivos .js e .mjs
                // exclude: /(node_modules)/, // Exclui a pasta node_modules (geralmente não transpilamos libs de terceiros, mas para pdfjs-dist vamos incluir)
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    }
} 
   
