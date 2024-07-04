const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with userModel");
  })
  .catch((error) => {
    console.log(error);
  });

  
const user = new mongoose.Schema({
    Username: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true
    },
    Number: {
        type: Number,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    coupon: {
        type: Array,
        trim: true,
    },
    wallet:{
        type:Number,
        
    }

});

module.exports = mongoose.model("userModel", user);

