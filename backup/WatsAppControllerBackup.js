import { DocumentPreviewControler } from "./../controller//DocumentPreviewController.js";
import {CameraController } from "./../Util/CameraController.js";
import { Format } from "./../Util/Format.js";
import { MicrophoneController } from "./Microphone.js";
import { Firebase } from "../Util/firebase.js";
import { User } from "../model/user.js";

export default class WhatsAppController{

    constructor(){
        console.log('whatsapp');
        this._firebase = new Firebase();
        this.elementsPrototype();
        this.loadElements();
        this.initAuth(); // Chamar depois de loadElements para garantir que this.el esteja pronto
        this.initEvents();
    } 

    initAuth(){
    console.log('[WhatsAppController] Iniciando initAuth...');
    this._firebase.initAuth()
       .then((response)=>{ // Usuário ESTÁ autenticado ou initAuth resolveu com sucesso
        console.log('[WhatsAppController] initAuth .then() - Usuário autenticado ou initAuth bem-sucedido.');
        this._user = response.user; 

         if (response.token) {
            this._token = response.token; // Opcional: armazenar o token se necessário
          }
        // Não há evento 'datachange' no objeto firebase.User.
        // A UI deve ser atualizada diretamente e/ou com um listener do Firestore.

        // Salvar/Atualizar dados do usuário no Firestore usando o UID como ID do documento
        this._firebase.getDb().collection('users').doc(this._user.uid).set({
            name: this._user.displayName,
            email: this._user.email,
            photo: this._user.photoURL,
            // Você pode adicionar um timestamp de criação/último login aqui, por exemplo:
            // lastLoginAt: firebase.firestore.FieldValue.serverTimestamp() // requer importação de firebase/app e 'firebase/firestore'
        }, { merge: true }) // merge: true é bom para atualizações, para não apagar outros campos.
        .then(() => {
            console.log(`[WhatsAppController] Dados do usuário ${this._user.uid} salvos/atualizados no Firestore.`);
            this.el.appContent.css({ display: 'flex' });

            // Configurar um listener no Firestore para atualizações em tempo real dos dados do usuário
            // Isso substituirá a funcionalidade que 'datachange' parecia visar.
            this._unsubscribeUserListener = this._firebase.getDb().collection('users').doc(this._user.uid)
                .onSnapshot(docSnapshot => {
                    if (docSnapshot.exists) {
                        const userData = docSnapshot.data();
                        console.log('[WhatsAppController] Dados do usuário recebidos do Firestore (onSnapshot):', userData);

                        // Atualizar o título da página
                        document.querySelector('title').innerHTML = userData.name + ' - WhatsApp';

                        // Atualizar as fotos do perfil
                        const hasPhoto = userData.photo && typeof userData.photo === 'string' && userData.photo.trim() !== '';

                        if(hasPhoto){
                            // Foto do painel de edição de perfil
                            if (this.el.imgPanelEditProfile) {
                                this.el.imgPanelEditProfile.src = userData.photo;
                                this.el.imgPanelEditProfile.show();
                                if (this.el.imgDefaultPanelEditProfile) {
                                    this.el.imgDefaultPanelEditProfile.hide(); // Esconde o SVG padrão
                                } else {
                                    console.warn("[WhatsAppController] Elemento 'imgDefaultPanelEditProfile' não encontrado para esconder.");
                                }
                            } else {
                                console.warn("[WhatsAppController] Elemento 'imgPanelEditProfile' não encontrado em this.el.");
                            }

                            // Foto do perfil no cabeçalho (myPhoto)
                            if (this.el.myPhoto) {
                                const myPhotoImg = this.el.myPhoto.querySelector('img');
                                const myPhotoDefaultSvgContainer = this.el.myPhoto.querySelector('div._3ZW2E');
 
                                if (myPhotoImg) {
                                    myPhotoImg.src = userData.photo;
                                    myPhotoImg.show(); // Usa o método do protótipo para remover display:none
                                } else {
                                    console.warn("[WhatsAppController] Elemento <img> dentro de 'myPhoto' não encontrado.");
                                }

                                if (myPhotoDefaultSvgContainer) {
                                    myPhotoDefaultSvgContainer.hide(); // Esconde o container do SVG padrão
                                } else {
                                     console.warn("[WhatsAppController] Elemento SVG container (div._3ZW2E) dentro de 'myPhoto' não encontrado.");
                                }
                            } else {
                                console.warn("[WhatsAppController] Elemento 'myPhoto' não encontrado em this.el.");
                            }
                        } else {
                            // Lógica para quando não há foto (mostrar placeholders)
                            // Painel de edição de perfil
                            if (this.el.imgPanelEditProfile) {
                                this.el.imgPanelEditProfile.hide();
                                this.el.imgPanelEditProfile.src = '#'; // Resetar src
                                if (this.el.imgDefaultPanelEditProfile) {
                                    this.el.imgDefaultPanelEditProfile.show();
                                }
                            }

                            // Cabeçalho (myPhoto)
                            if (this.el.myPhoto) { // Lógica para placeholder de myPhoto
                                const myPhotoImg = this.el.myPhoto.querySelector('img');
                                const myPhotoDefaultSvgContainer = this.el.myPhoto.querySelector('div._3ZW2E');
                                if (myPhotoImg) {
                                    myPhotoImg.hide();
                                    myPhotoImg.src = '#'; // Resetar src
                                }
                                if (myPhotoDefaultSvgContainer) {
                                    myPhotoDefaultSvgContainer.show();
                                }
                            }
                        }
                    } else {
                        console.warn(`[WhatsAppController] Documento do usuário ${this._user.uid} não encontrado no Firestore.`);
                    }
                }, error => {
                    console.error("[WhatsAppController] Erro ao ouvir atualizações do usuário no Firestore:", error);
                });
        })
        .catch(error => {
            console.error("[WhatsAppController] Erro ao salvar dados do usuário no Firestore:", error);
            // Mesmo com erro no Firestore, o app pode continuar se o login no Auth funcionou.
            this.el.appContent.css({ display: 'flex' });
        });

        // Atualização inicial da UI com os dados do Firebase Auth (antes do listener do Firestore pegar)
        // Isso garante que algo seja exibido imediatamente.
        document.querySelector('title').innerHTML = this._user.displayName + ' - WhatsApp';
        // A atualização da foto será feita pelo listener do Firestore assim que os dados forem carregados/salvos.
       })
       .catch(err=>{ // Usuário NÃO ESTÁ autenticado ou initAuth rejeitou
            console.log('[WhatsAppController] initAuth .catch() - Usuário NÃO autenticado ou initAuth falhou.');
            console.warn('[WhatsAppController] initAuth FALHOU (usuário não logado inicialmente):', err.message);
            // Esconder o conteúdo principal do app
            this.el.appContent.css({ display: 'none' });

            // Tentar login com Google automaticamente
            console.log('[WhatsAppController] Tentando login automático com Google...');
            this._firebase.signInWithGoogle() // <--- AQUI ELE TENTA O LOGIN AUTOMÁTICO
                .then(signInResponse => {
                    // Se o login automático com Google for bem-sucedido:
                    console.log('[WhatsAppController] signInWithGoogle (automático) .then() - SUCESSO.');
                    this._user = signInResponse.user; // Armazena o objeto de usuário do Firebase Auth
                    console.log('[WhatsAppController] signInWithGoogle (automático) SUCESSO:', this._user.uid);
                    if (signInResponse.token) {
                        this._token = signInResponse.token;
                    }

                    // Salvar/Atualizar dados do usuário no Firestore
                    this._firebase.getDb().collection('users').doc(this._user.uid).set({
                        name: this._user.displayName,
                        email: this._user.email,
                        photo: this._user.photoURL,
                    }, { merge: true })
                    .then(() => {
                        console.log(`[WhatsAppController] Dados do usuário ${this._user.uid} (após login automático) salvos/atualizados no Firestore.`);
                    })
                    .catch(dbError => {
                        console.error("[WhatsAppController] Erro ao salvar dados do usuário no Firestore (após login automático):", dbError);
                    });

                    // Mostrar conteúdo principal do app
                    this.el.appContent.css({ display: 'flex' });
                })
        .catch(signInError => {
            // Se o login automático com Google FALHAR:
            console.log('[WhatsAppController] signInWithGoogle (automático) .catch() - FALHA.');
            console.error('[WhatsAppController] signInWithGoogle (automático) FALHOU:', signInError);
            // Como não temos uma tela de login manual definida no seu HTML (this.el.loginScreen não existe),
            // ele cai no 'else' e mostra este alerta:
            alert("Falha na tentativa de login com Google. Verifique o console para mais detalhes, se as credenciais do Firebase (API Keys, etc.) estão corretas no arquivo firebase.js e se os Domínios Autorizados estão configurados no Firebase Console. Pode ser necessário atualizar a página.");
        });
    })
}

    // Lembre-se de cancelar a inscrição do listener quando o controller for destruído ou o usuário fizer logout
    // Exemplo:
    // componentWillUnmount() { // Ou método equivalente no ciclo de vida do seu app
    //   if (this._unsubscribeUserListener) this._unsubscribeUserListener();
    // }
 

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

bindLoginButtonEvent() {
    // Este método deve ser chamado em initEvents se você tiver um botão de login
    // Supondo que você tenha um botão com id="btn-login-google" no seu HTML
    if (this.el.btnLoginGoogle) {
        this.el.btnLoginGoogle.on('click', () => {
            console.log('[WhatsAppController] Botão de login com Google clicado.');
            this.el.btnLoginGoogle.disabled = true; // Desabilitar para evitar cliques múltiplos
            this.el.btnLoginGoogle.innerHTML = 'Aguarde...'; // Feedback visual

            this._firebase.signInWithGoogle() // Chama o método ATIVO de login
                .then(response => {
                    console.log('[WhatsAppController] signInWithGoogle SUCESSO:', response.user);
                    // O onAuthStateChanged (se configurado corretamente no Firebase.js para persistir)
                    // deve detectar a mudança e o initAuth (ou um listener dedicado) reagiria.
                    // Por segurança, podemos chamar initAuth() novamente para garantir que a UI seja atualizada.
                    this.initAuth(); // Re-executa para verificar o novo estado e atualizar a UI
                })
                .catch(error => {
                    console.error('[WhatsAppController] signInWithGoogle FALHOU:', error);
                    alert(`Erro ao tentar login: ${error.message}`);
                    this.el.btnLoginGoogle.disabled = false;
                    this.el.btnLoginGoogle.innerHTML = 'Login com Google';
                });
        });
    }
}
initEvents(){
    this.el.myPhoto.on('click',e=>{
        this.closeAllLeftPanel();
        this.el.panelEditProfile.show();
        setTimeout(()=>{
            this.el.panelEditProfile.addClass('open');

        },300)
       this.bindLoginButtonEvent(); // Chame isso se o botão estiver em algum painel, ou chame no final de initEvents

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
    });
    this.bindLoginButtonEvent(); // Chamar aqui para garantir que o evento seja ligado
   
 }
 //  startRecordeMicrofoneTime(){
   //   let start = Date.now();
    //  this._recordMicrophoneTimer = setInterval(() =>{
        
      //  this.el.recordMicrophoneTimer.innerHTML = (Format.totime(Date.now() - start));
           // this.el.recordMicrophoneTimer.innerHTML = `${hours}:${minutes}:${seconds}`;
   //   }, 100);
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