const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with whishlist");
  })
  .catch((error) => {
    console.log(error);
  });

const whishlistMangament = new mongoose.Schema({
    userId: {
        type: String,
        required:true
    },
    proId:{
        type:String,
        required:true,
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

})
module.exports = mongoose.model("whishlist", whishlistMangament)