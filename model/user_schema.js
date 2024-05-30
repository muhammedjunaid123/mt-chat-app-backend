const mongoose=require('mongoose')


const user_schema=new mongoose.Schema({
    email:{
        required:true,
        type:String
    },
    password:{
        required:true,
        type:String
    },
   name:{
        required:true,
        type:String
    }
})

module.exports=new mongoose.model('user',user_schema)