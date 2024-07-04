const mongoose=require('mongoose')

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with catergoryModel");
  })
  .catch((error) => {
    console.log(error);
  });

const categorySchema = new mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
})
module.exports=mongoose.model('category',categorySchema)