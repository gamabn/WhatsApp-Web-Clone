export class CameraController {

    constructor(videoEl){
        this._videoEl = videoEl;

        navigator.mediaDevices.getUserMedia({
            video: true,
            
        }).then(strem=>{
            this._strem = strem;
            this._videoEl.src = URL.createObjectURL(strem);
            this._videoEl.play();
            
        }).catch(err=>{
            console.error(err);
        });

    }
    stop(){
       // strem.getTracks().forEach(track => track.stop());
    this._strem.getTracks().forEach(track => track.stop());
    }
    takePicture(mimetipe = 'image/png'){ 

        let canvas = document.createElement('canvas');

        canvas.setAttribute('width', this._videoEl.videoWidth);
        canvas.setAttribute('height', this._videoEl.videoHeight);


        let ctx = canvas.getContext('2d');

        ctx.drawImage(this._videoEl, 0,0, canvas.width, canvas.height);

        return canvas.toDataURL(mimetipe )
    }

}