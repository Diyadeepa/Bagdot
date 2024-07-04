const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with cartModel");
  })
  .catch((error) => {
    console.log(error);
  });

const cartMangament = new mongoose.Schema({
    userId: {
        type: String,
        required:true
    },
    proId:{
        type:String,
        required:true
    },
    
    product: {
        type: String,
        required: true
    },
    Image: {
        type: String,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    Quantity: {
        type: Number,
        required: true
    }
})
module.exports = mongoose.model("Cart", cartMangament)