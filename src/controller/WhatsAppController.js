import { DocumentPreviewControler } from "./../controller//DocumentPreviewController.js";
import {CameraController } from "./../Util/CameraController.js";
import { Format } from "./../Util/Format.js";
import { MicrophoneController } from "./Microphone.js";

export default class  WhatsAppController{

    constructor(){
        console.log('whatsapp');
        this.elementsPrototype();
        this.loadElements();
        this.initEvents();
    } 

    loadElements(){

        this.el = {}

        document.querySelectorAll('[id]').forEach(element=>{

            this.el[Format.getCamelCase(element.id)] = element;

        })
    }

    elementsPrototype(){

   Element.prototype.hide = function(){
     this.style.display = 'none';
     return this;
     }

     Element.prototype.show = function(){
        this.style.display = 'block';
        return this;
  }

  Element.prototype.toggle = function(){
    this.style.display = (this.style.display === 'none')? 'block': 'none';
    return this;
   }

   Element.prototype.on = function(events,fn){
    events.split(' ').forEach(event =>{
        this.addEventListener(event, fn);
    })
    return this;
   }

   Element.prototype.css = function(styles){
      for(let name in styles){
        this.style[name] = styles[name]

      }
      return this;
   }
   Element.prototype.addClass = function(name){
    this.classList.add(name);
   }

   Element.prototype.removeClass = function(name){
    this.classList.remove(name);
    return this;
   }

   Element.prototype.toggleClass = function(name){
    this.classList.toggle(name);
    return this;
  }

  Element.prototype.hasClass = function(name){
   return this.classList.contains(name);
 } 
 
 HTMLFormElement.prototype.getForm = function(){
    return new FormData(this);
 }

 HTMLFormElement.prototype.toJSON = function(){
    let json = {}
   this.getForm().forEach((value, key) =>{
    json[key] = value;
   })
   return json;
 }
}
initEvents(){
    this.el.myPhoto.on('click',e=>{
        this.closeAllLeftPanel();
        this.el.panelEditProfile.show();
        setTimeout(()=>{
            this.el.panelEditProfile.addClass('open');

        },300)
       
    });

    this.el.btnNewContact.on('click',e =>{
        this.closeAllLeftPanel();
        this.el.panelAddContact.show();
        setTimeout(()=>{
            this.el.panelAddContact.addClass('open');

        },300)
       // this.el.panelAddContact.addClass('open');

    })

   this.el.btnClosePanelAddContact.on('click',e=>{
    this.el.panelAddContact.removeClass('open');
    console.log('clicou');
   }
 )

    this.el.btnClosePanelEditProfile.on('click',e=>{
       this.el.panelEditProfile.removeClass('open');
      
    })
    this.el.photoContainerEditProfile.on('click', e=> {
        this.el.inputProfilePhoto.click();
    })
    this.el.inputNamePanelEditProfile.on('keypress', e=>{
        if(e.key === 'Enter'){
            e.preventDefault()
            this.el.btnSavePanelEditProfile.click()
        }
    })

    this.el.btnSavePanelEditProfile.on('click', e=>{
        console.log(this.el.inputNamePanelEditProfile.innerHTML)
    })

    this.el.formPanelAddContact.on('submit', e=>{
        e.preventDefault();
        let formaData = new FormData(this.el.formPanelAddContact)
    })
    this.el.contactsMessagesList.querySelectorAll('.contact-item').forEach((item, key) =>{
        item.on('click', e=>{
            this.el.home.hide();
            this.el.main.css({
                display: 'flex'
            })
        })
    })

    this.el.btnAttach.on('click', e=>{
        e.stopPropagation()
        this.el.menuAttach.addClass('open') 
        document.addEventListener('click', this.closeMenuAttach.bind(this))    
    })

    this.el.btnAttachPhoto.on('click', e=>{
        this.el.inputPhoto.click();
    })

    this.el.inputPhoto.on('change', e=>{

        console.log(this.el.inputPhoto.files);

        [...this.el.inputPhoto.files].forEach(file=>{
            console.log('arquivo map',file)
        })
    })

    this.el.btnAttachCamera.on('click', e=>{

      this.closeAllMainPanel();
       this.el.panelCamera.addClass('open');
       this.el.panelCamera.css({
        'height':'calc(100% - 120px)' 
       });
       this._camera = new CameraController(this.el.videoCamera);
        
    });

    this.el.btnClosePanelCamera.on('click', e=>{
        
        this.el.closeAllMainPanel();
        this.el.panelMessagesContainer.show();
        this._camera.stop();
    })

    this.el.btnTakePicture.on('click', e=>{

      let dataUrl =  this._camera.takePicture();
      this.el.pictureCamera.src = dataUrl
      this.el.pictureCamera.show()
      this.el.videoCamera.hide()
      this.el.btnReshootPanelCamera.show()
      this.el.containerTakePicture.hide()
      this.el.containerSendPicture.show()

    })
    this.el.btnReshootPanelCamera.on('click', e=>{
        this.el.videoCamera.show()
        this.el.pictureCamera.hide()
        this.el.btnReshootPanelCamera.hide()
        this.el.containerTakePicture.show()
        this.el.containerSendPicture.hide()
    })
    this.el.btnSendPicture.on('click', e=>{
        console.log(this.el.videoCamera.src)
    })


    this.el.btnAttachDocument.on('click', e=>{

        this.closeAllMainPanel();
        this.el.panelDocumentPreview.addClass('open');
        this.el.panelDocumentPreview.css({
            'height':'calc(100% - 120px)' 
           });
           this.el.inputDocument.click();
    })

    this.el.inputDocument.on('change', e=>{

            this.el.panelDocumentPreview.css({
                    'height':'1%' 
           });

        if(this.el.inputDocument.files.length){
            let file = this.el.inputDocument.files[0];
            
            this._documentPreviewController = new DocumentPreviewControler(file);

            this._documentPreviewController.getPreviewData().then(result=>{
                 this.el.imgPanelDocumentPreview.src = result.src;
                 this.el.infoPanelDocumentPreview.textContent = result.info;
             // INCORRETO: <img> não renderiza innerHTML como texto visível.
             // this.el.imgPanelDocumentPreview.innerHTML = result.info;

             // CORRETO: Use um elemento dedicado para o texto de informação.
             // Certifique-se de que você tem um elemento no seu HTML (ex: <div id="doc-preview-info-text"></div>)
             // e que ele é carregado em this.el (ex: this.el.docPreviewInfoText).
             // Ajuste 'docPreviewInfoText' para o nome camelCase do ID do seu elemento de texto.
                 
               //  console.log("[WhatsAppController] Tentando atualizar info do documento. Elemento (this.el.docPreviewInfoText):", this.el.docPreviewInfoText, "Info para exibir (result.info):", result.info);
               //  if (this.el.infoPanelDocumentPreview) {
               //     this.el.infoPanelDocumentPreview.textContent = result.info;
                 //    console.log("[WhatsAppController] Conteúdo de texto atualizado para:", this.el.infoPanelDocumentPreviewnfoText.textContent);
                // } else {
                 //    console.warn("[WhatsAppController] Elemento 'docPreviewInfoText' (ou similar com ID 'doc-preview-info-text') não encontrado em this.el. Não foi possível exibir a contagem de páginas.");
                // }
             this.el.imagePanelDocumentPreview.show()
             this.el.filePanelDocumentPreview.hide()

              this.el.panelDocumentPreview.css({
                    'height':'calc(100% - 120px)' 
           });
                       
           }).catch(err=>{

                this.el.panelDocumentPreview.css({
                        'height':'calc(100% - 120px)' 
                      });
                      
                console.error(file.type);


                    switch(file.type){
                        case 'application/x-zip-compressed':
                        case 'application/vnd.ms-excel': 
                            this.el.iconPanelDocumentPreview.className =  'jcxhw icon-doc-xls';
                        break;

                        default:
                            this.el.iconPanelDocumentPreview.className =  'jcxhw icon-doc-generic';
                            break;
                    }
                 this.el.imagePanelDocumentPreview.hide()
                 this.el.filePanelDocumentPreview.show()
                })
                }

    })

    this.el.btnClosePanelDocumentPreview.on('click',e=>{
      
        this.closeAllMainPanel();
        this.el.panelMessagesContainer.show();
    })
    this.el.btnSendDocument.on('click', e=> {
        console.log('Send document')
    })

    this.el.btnAttachContact.on('click', e=>{
       this.el.modalContacts.show();
    })

    this.el.btnCloseModalContacts.on('click', e=>{
        this.el.modalContacts.hide();
        
    })

     this.el.btnSendMicrophone.on('click', e=>{
        this.el.recordMicrophone.show();
        this.el.btnSendMicrophone.hide();
       // this.startRecordeMicrofoneTime();
      
       this._recordMicrophoneTimer = new  MicrophoneController
        
       this._recordMicrophoneTimer.on('ready', music=>{

        console.log('evento play', music)

        this._recordMicrophoneTimer.startRecord()

       })

       this._recordMicrophoneTimer.on('recordTimer', timer=>{
           this.el.recordMicrophoneTimer.innerHTML = Format.totime(timer);
       })
    })

    this.el.btnCancelMicrophone.on('click', e=>{
      
       this._recordMicrophoneTimer.stopRecord()
        this.closeRecordMicrophone();
    })

    this.el.btnFinishMicrophone.on('click', e=>{
        this._recordMicrophoneTimer.stopRecord()
      this.closeRecordMicrophone();   
    })

    this.el.inputText.on('keypress', e=>{
        if(e.key === 'Enter' && !e.ctrlKey){
            e.preventDefault();
            this.el.btnSend.click();
        }
           
       
        })

    this.el.inputText.on('keyup', e=>{
        if(this.el.inputText.innerHTML.length ){

          this.el.inputPlaceholder.hide();
          this.el.btnSendMicrophone.hide();
          this.el.btnSend.show();

        } else{
            this.el.inputPlaceholder.show()
            this.el.btnSendMicrophone.show();
            this.el.btnSend.hide();

        }
        this.el.btnSend.on('click', e=>{
            console.log('Clicou o enviar mensagem');
        })
    })

    this.el.btnEmojis.on('click',e=>{
        this.el.panelEmojis.toggleClass('open');
    
    })
    this.el.panelEmojis.querySelectorAll('.emojik').forEach(item =>{
        item.on('click', e=>{
           // console.log('clicou Emoji',item.dataset.unicode)
            let img = this.el.imgEmojiDefault.cloneNode();

            img.style.cssText = item.style.cssText;
            img.dataset.unicode =  item.dataset.unicode;
            img.alt = item.dataset.unicode;

            item.classList.forEach(name=>{
                img.classList.add(name);
            })

            let cursor = window.getSelection();

            if (cursor.focusNode !== this.el.inputText) {
                this.el.inputText.focus();
                cursor = window.getSelection();
            }

            let range = document.createRange();
            
            range = cursor.getRangeAt(0);
            range.deleteContents()

            let frag = document.createDocumentFragment()

            frag.appendChild(img);
            range.insertNode(frag);
            range.setStartAfter(img);
            //range.setEndAfter(img); 

            //this,this.el.inputText.appendChild(img);
            this.el.inputText.dispatchEvent(new Event('keyup'))
           // this.el.inputText.focus();
        })
    })
   
 }
 //  startRecordeMicrofoneTime(){
   //   let start = Date.now();
    //  this._recordMicrophoneTimer = setInterval(() =>{
        
      //  this.el.recordMicrophoneTimer.innerHTML = (Format.totime(Date.now() - start));

        //let elapsed = Date.now() - start;
        //let seconds = Math.floor((elapsed / 1000) % 60);
       // let minutes = Math.floor((elapsed / 1000 / 60) % 60);
       // let hours = Math.floor((elapsed / 1000 / 3600) % 24);
       // this.el.recordMicrophoneTimer.innerHTML = `${hours}:${minutes}:${seconds}`;

     // }, 100);
 // }
    closeRecordMicrophone(){
         this.el.recordMicrophone.hide();
         this.el.btnSendMicrophone.show();
       //  clearInterval(this._recordMicrophoneTimer);
    }

    closeAllMainPanel(){

        this.el.panelMessagesContainer.hide();
        this.el.panelDocumentPreview.removeClass('open');
        this.el.panelCamera.removeClass('open');
 }

 closeMenuAttach(e){
    document.removeEventListener('click', this.closeMenuAttach)
    this.el.menuAttach.removeClass('open')
 }

 closeAllLeftPanel(){
    this.el.panelAddContact.hide();
    this.el.panelEditProfile.hide();
 }
   // startTime(){
    //    let start = Date.now();
    //  this._recordMicrophoneTimer = setInterval(() =>{
     //       this.el.recordMicrophoneTimer.innerHTML = (Format.totime(Date.now() - start));
           // this.el.recordMicrophoneTimer.innerHTML = `${hours}:${minutes}:${seconds}`;
   //   }, 100);
        
  //  }    

}
 //app.el.btnNewContact.on('click mouseover dblclick', (event)=>{console.log('clicou', event.type)})