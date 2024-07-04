const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connection established with productModel");
  })
  .catch((error) => {
    console.log(process.env.MONGODB_URI);
    console.log(error);
  });

const productSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    image: {
        type: Array,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
})
module.exports = mongoose.model('product', productSchema)