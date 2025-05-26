import { ClassEvent } from '../Util/classEvent.js'

export class MicrophoneController extends ClassEvent{

    constructor() {

        super();
    
        this._available = false;
        this._mimetype = 'audio/webm';

        navigator.mediaDevices.getUserMedia({
            audio: true

        }).then(stream =>{
            this._available = true;

            this._stream = stream;
            this.trigger('ready', this._stream)
           // let audio = new Audio();

           // audio.src = URL.createObjectURL(stream);
           // audio.play();
          
        }).catch(err =>{
            console.error(err);
           // this._available = false;
        }) 
    }

    isAvailable(){
        return this._available;
    }

   stop(){
        this._stream.getTracks().forEach(track => track.stop());
    
    }
    startRecord(){
        if(this._available) {
           this._mediaRecorder = new MediaRecorder(this._stream, {
            mimeType: this._mimetype
           });
           this._recordedChuncks = [];
           this._mediaRecorder.addEventListener('dataavailable', e=>{
            if(e.data.size > 0){
                this._recordedChuncks.push(e.data);
            }
            
           })
            this._mediaRecorder.addEventListener('stop', e=>{
                let blob = new Blob(this._recordedChuncks, {type: this._mimetype});
               // let url = URL.createObjectURL(blob);
               let filename =  `rec${Date.now()}.webm}`
               let file = new File([blob],filename,{
                    type: this._mimetype,
                    lastModified: Date.now()
                });
                console.log('file',file);

                  //  let reader = new FileReader();
                  //  reader.onload = e => {

                     //   console.log('reader file',file);

                      //  let audio = new Audio(reader.result);
                        //audio.src = e.target.result;
                      //  audio.play();

                  //  }

            });
           
            this._mediaRecorder.start();
            this.startTime()
        }

        //if(!this._available) return;

       // this._available = true;
       // this._stream.getTracks().forEach(track => track.start(0));
    }

    stopRecord(){
        //this._available = false;
       // this._stream.getTracks().forEach(track => track.stop());
       if(this._mediaRecorder) {
        this._mediaRecorder.stop()
        this.stop();
        this.stopTimer()
       }
    }
    stopTimer(){
        clearInterval(this._recordMicrophoneInterval);
    }

     startTime(){
            let start = Date.now();
            this._recordMicrophoneInterval = setInterval(() =>{
               // this.el.recordMicrophoneTimer.innerHTML = (Format.totime(Date.now() - start));
               // this.el.recordMicrophoneTimer.innerHTML = `${hours}:${minutes}:${seconds}`;
               this.trigger('recordTimer', (Date.now() - start))
          }, 100);
            
        }    
}