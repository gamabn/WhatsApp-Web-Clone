import { Firebase } from "../Util/firebase";
import { Model } from "./model";

export class User extends Model{
    
    constructor(id){
        super();
        this._data = {}
        if (id) this.getById(id);

    }

    getById(id){
       return new Promise((s, f)=>{
        User.findByEmail(id).then(doc =>{
            this.fromJSON(doc.data())
        })

       });
    }
    save(){
     return User.findByEmail(this.email).set(this.toJSON(0))
    }

    static getRef()
        {
        const firebaseInstance = new Firebase(); // Cria uma instância
        return firebaseInstance.getDb().collection("/users");
    }
    static findByEmail(email){
       // return User.getRef().where("email", "==", email).get();
       return User.getRef().doc(email)

    }
}
