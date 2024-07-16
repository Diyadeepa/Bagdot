const mongoose = require('mongoose')
require('dotenv').config();

mongoose
  .connect("mongodb+srv://diyauday21:lT6bxSNzWvV0Uvoz@cluster0.vqixfli.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Connection established with orderModel");
  })
  .catch((error) => {
    console.log("=================================");
    console.log(error);
  });


const OrderManagement = new mongoose.Schema({

    orderID: {
        type: String,
        required: true,
        trim: true,
    },
    user: {
        type: String,
        required: true,
        trim: true,
    },

    products: {
        type: Array,
        required: true,
        trim: true,
    },

    totalOrderValue: {
        type: Number,
        required: true,
        trim: true,
    },

    discount: {
        type: Number,
        required: true,
        trim: true,
    },

    address: {
        type: Object,
        required: true,
        trim: true,
    },

    paymentMethod: {
        type: String,
        required: true,
        trim: true,
    },

    date: {
        type: Date,
        trim: true,
    },

    status: {
        type: String,
        trim: true,
    },

    paymentStatus: {
        type: String,
        trim: true,
    },

    return_Reason: {
        type: String,
        trim: true,
    },
    coupon:{
        type: String,
    },

    cancel: {
        type: String,
        trim: true,
    },

});

module.exports = mongoose.model("OrderManagement", OrderManagement)