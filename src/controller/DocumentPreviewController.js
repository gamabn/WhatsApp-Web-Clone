//const pdfjsLib = require('pdfjs-dist/build/pdf.mjs');
// const path = require('path') // Não é mais necessário para esta linha
import 'pdfjs-dist/build/pdf.js';
const PDFJS = require('pdfjs-dist');

// Configuração do worker
PDFJS.disableWorker = false;
PDFJS.workerSrc = '/dist/pdf.worker.bundle.js';

export class DocumentPreviewControler {

    constructor(file){
        this._file = file 
    }
       getPreviewData(){
        return new Promise((s,f)=>{

           let reader = new FileReader()

            switch(this._file.type){
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg':
                case 'image/gif': 

               // let reader = new FileReader()

                reader.onload = e =>{

                    s({
                       src: reader.result,
                       info: this._file.name
                    })

                }
                reader.onerror = e =>{
                    f(e)
                }
                reader.readAsDataURL(this._file)
                
                break; 
            
                case 'application/pdf':
                    reader.onload = e => {
                        try {
                            let loadingTask = PDFJS.getDocument({
                                data: reader.result,
                                nativeImageDecoderSupport: 'none',
                                disableFontFace: true
                            });
                            
                            loadingTask.then(pdf => {
                                pdf.getPage(1).then(page => {
                                    let viewport = page.getViewport(1.0);
                                    let canvas = document.createElement('canvas');
                                    let context = canvas.getContext('2d');
                                    canvas.height = viewport.height;
                                    canvas.width = viewport.width;
                                    
                                    page.render({
                                        canvasContext: context,
                                        viewport: viewport
                                    }).then(() => {
                                        let _s = (pdf.numPages > 1) ? 's' : '';
                                        s({
                                            src: canvas.toDataURL('image/png'),
                                            info: `${pdf.numPages} página${_s}`
                                        });
                                    }).catch(err => {
                                        console.error('Erro na renderização:', err);
                                        f(err);
                                    });
                                }).catch(err => {
                                    console.error('Erro ao carregar página:', err);
                                    f(err);
                                });
                            }).catch(err => {
                                console.error('Erro ao carregar PDF:', err);
                                f(err);
                            });
                        } catch (err) {
                            console.error('Erro ao processar PDF:', err);
                            f(err);
                        }
                    }
                    reader.readAsArrayBuffer(this._file)


                 break;

                 default:

                 f()
            }         
        })
    }

}