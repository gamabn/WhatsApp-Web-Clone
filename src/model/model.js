import { ClassEvent } from "../Util/classEvent";

export class Model extends ClassEvent{

    constructor(){
        super();
         this._data = {};

    }

    fromJSON(json){
        this._data = Object.assign(this._data, json);
        this.trigger('change', this.toJSON)
    }

    toJSON(){
        this._data
    }


}