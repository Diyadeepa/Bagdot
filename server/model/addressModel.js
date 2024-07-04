const mongoose = require('mongoose')


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with addressModel");
  })
  .catch((error) => {
    console.log(error);
  });

const addersMangament = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    address:[
        {
            Name:{
                type:String,
                required:true
            },
            Number:{
                type:Number,
                required:true

            },
            Email:{
                type:String,
            },
            Housename:{
                type:String,
                required:true
            },
            Streetname:{
                type:String,
                required:true
            },
            Pincode:{
                type:Number,
                required:true
            },
            City:{
                type:String,
                required:true
            },
            State:{
                type:String,
                required:true
            },
            Country:{
                type:String,
                required:true
            },
            SaveAs:{
                type:String,
                required:true
            }
        }
    ]
})
module.exports = mongoose.model("Adders", addersMangament)