const addressModel = require('../../model/addressModel');
const userModel = require('../../model/useModel');
const cartModel = require('../../model/cartModel');
const productModel = require('../../model/productModel');
const otpGenerator = require('otp-generator');
const orderModel = require('../../model/orderModel');
const couponModel =require("../../model/coupon");
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const walletModel = require('../../model/walletModel');
const path = require("path");
const fs = require("fs")
const puppeteer = require("puppeteer");
const { Transaction } = require('mongodb');
const { response } = require('express');
const ObjectId = mongoose.Types.ObjectId;
require('dotenv').config();
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;



const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_ClUZxn3BRreTaS',
    key_secret: 'tdhDbLTivX4g5y5u5Oo7AVfZ'
});


const addNewAddress = async (req, res) => {
    try {
        console.log(req.body)

        const userAddress = await addressModel.find({ userId: req.session.userId });
        console.log(userAddress)
        const email = req.body.email || null
        let addressData = {
            Name: req.body.name,
            Number: req.body.mobile,
            Email: email,
            Housename: req.body.housename,
            Streetname: req.body.street,
            State: req.body.state,
            Pincode: req.body.pincode,
            City: req.body.city,
            Country: req.body.country,
            SaveAs: req.body.saveas
        };
        if (userAddress.length > 0) {
            console.log('userAddress found')

            const data = await addressModel.updateOne(
                { _id: userAddress[0]._id },
                { $push: { address: addressData } },
            );
        } else {
            let address = new addressModel({
                userId: req.session.userId,
                address: [addressData]
            })

            await address.save()
        }

        res.redirect('/checkout')
    } catch (e) {
        console.log('error in the addNewAddress :', e);
    }
}

const checkoutPage = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.userId })
        const data = await addressModel.findOne({ userId: req.session.userId });
        console.log(data)
        const cartData = await cartModel.find({ userId: req.session.userId })

        const totalValue = await cartModel.aggregate([
            {
                $match: { userId: req.session.userId }
            },
            {
                $group: {
                    _id: "$proId",
                    totalPrice: { $sum: "$Price" },
                    totalQuantity: { $sum: "$Quantity" }
                }
            },
            {
                $project: {
                    _id: 1,
                    amount: {
                        $multiply: ["$totalPrice", "$totalQuantity"]
                    }
                }
            },
            {
                $group: {
                    _id: '',
                    sum: {
                        $sum: '$amount'
                    }
                }
            }
        ])
        totalAmount = totalValue[0].sum;
        req.session.amount = totalAmount + 50
        console.log(cartData[0].product, './././././././././././././.')
        const coupon=await couponModel.find({})
       
     
        const wallet=await walletModel.findOne({ userId:userData._id })
        console.log(userData,'+++++++++++++++++++++++++++++userdata for wallet')
        console.log(userData.wallet,'userwallettttttttttttttttttttttttttttt')
        let walletData=0
        if(userData.wallet){
        walletData=wallet.wallet;
        }
        res.render('checkout', { data: data, cartData: cartData, totalAmount: totalAmount,coupon:coupon,walletData:walletData});
    } catch (e) {
        console.log('error in the checkoutPage : '.e);
    }
}


const fetchAddress = async (req, res) => {
    try {
        console.log("eterertyetegehb")
        const data = await addressModel.findOne({ userId: req.session.userId });
        console.log(req.body)
        console.log(data.address[req.body.id])
        let dataGot = data.address[req.body.id]
        res.json({ response: true, dataGot })

    } catch (e) {
        console.log("entered to the fetchAddress" + e)
    }
}


const placeOrder = async (req, res) => {
    try {

        console.log(req.body,'req.body------------------');
        const addressData = await addressModel.findOne({ userId: req.session.userId });
        const userData = await userModel.findOne({ _id: req.session.userId });
        const cartData = await cartModel.find({ userId: req.session.userId });
        const productData = await productModel.find({ proId: req.query.proId });


        console.log(addressData.address[req.body.addressPos])
        console.log(userData, 'userdata');
        console.log(cartData, 'cartData');
        console.log(productData, 'product')

        const totalValue = await cartModel.aggregate([
            {
                $match: { userId: req.session.userId }
            },
            {
                $group: {
                    _id: "$proId",
                    totalPrice: { $sum: "$Price" },
                    totalQuantity: { $sum: "$Quantity" }
                }
            },
            {
                $project: {
                    _id: 1,
                    amount: {
                        $multiply: ["$totalPrice", "$totalQuantity"]
                    }
                }
            },
            {
                $group: {
                    _id: '',
                    sum: {
                        $sum: '$amount'
                    }
                }
            }
        ])
        totalAmount = totalValue[0].sum;

        const orderId = otpGenerator.generate(16, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

        console.log(orderId);


        for (let i = 0; i < cartData.length; i++) {
            console.log(i, 'for loop', cartData[i])
            cartData[i].userId = 'Pending';
            const productInfo = await productModel.updateOne({ _id: cartData[i].proId }, { $inc: { stock: -cartData[i].Quantity } })
            console.log(productInfo)


        }

        console.log(cartData, 'updaterd cartData././././.')


        const orderData = new orderModel({
            orderID: orderId,
            user: userData.Username,
            products: cartData,
            totalOrderValue: totalAmount,
            discount: req.session.amount || 0,
            address: addressData.address[req.body.addressPos],
            paymentMethod: req.body.payment,
            date: new Date(),
            status: "Pending",
        })

        await orderData.save();

        const deleteCart = await cartModel.deleteMany({ userId: req.session.userId });
        console.log(deleteCart)
        res.json({ response: true, id: orderId });
    

    } catch (e) {
        console.log('placeOrder error : ', e);
    }
}


const orderPlacedSuccessful = async (req, res) => {
    try {
        const orderData = await orderModel.findOne({ orderID: req.query.id });
        console.log(orderData)
        res.render('orderPlacedSuccessful', { data: orderData })

    } catch (e) {
        console.log('error in orderPlacedSuccessful : ', e)
    }
}

const orderHistory = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.userId })
        const orderData = await orderModel.find({ user: userData.Username }).sort({ _id: -1 });
        console.log(userData.Username, '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
        res.render('orderHistoryPage', { data: orderData })

    } catch (e) {
        console.log('error in the orderHistory : ', e);
    }
}


const oderDetails = async (req, res) => {
    try {
        const data = await orderModel.findOne({ orderID: req.query.id })
        console.log(data)
        res.render('userOderDetails', { data: data })

    } catch (e) {
        console.log(e)
    }
}

const cancelOder = async (req, res) => {
    try {
        console.log(req.query, 'oderrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr')
        // const userData = await userModel.findOne({_id:req.session.userId});

        const orderData = await orderModel.findOne({ orderID: req.query.orderId })

        const data = await orderModel.updateOne({ orderID: req.query.orderId, 'products.proId': req.query.id }, { $set: { 'products.$.userId': "Cancelled" } })
        let update = false;
        if (orderData.paymentMethod === 'online' || orderData.paymentMethod === 'wallet') {
            // Step 1: Mark the order as refunded
            await orderModel.updateOne({ orderID: req.query.orderId }, { paymentStatus: 'refunded' });
            const product = orderData.products.find(product => product.proId === req.query.id);

            const refundAmount = product.Price;
            const userId = orderData.user;  // Assuming orderData has a userId field


            console.log(userId)
            console.log(refundAmount)

            const check = await userModel.updateOne(
                { Username: userId },
                { $inc: { wallet: refundAmount } }
            );
            console.log(check, '======================================');
            console.log(req.session.userId, '+++++++++++++++++++++++++++++++++++++++++++++++')
            console.log(req.body.orderId, 'orderId-------------')
            const wallet = await walletModel.findOne({ userId: req.session.userId })
            console.log(wallet)
            const Transaction = [];
            const data = {
                date: new Date(),
                type: `Credited for cancelling `,
                amount: refundAmount,
            }
            Transaction.push(data)
            if (!wallet) {
                const newUser = new walletModel({
                    userId: req.session.userId,
                    wallet: refundAmount,
                    walletTransactions: [data],
                });
                const savedUser = await newUser.save();

                console.log(savedUser, '---------------------------------------')
            } else {
                await walletModel.updateOne(
                    { userId: req.session.userId },
                    {
                        $inc: { wallet: refundAmount },
                        $push: { walletTransactions: Transaction },
                    }
                );
            }
        }
        for (let i = 0; i < orderData.products.length; i++) {
            if (orderData.products[i].userId != "Cancelled") {
                update = true;
                await productModel.updateOne({ _id: orderData.products[i].proId }, { $inc: { stock: orderData.products[i].Quantity } });
            }
        }
        if (update) {
            await orderModel.updateOne({ orderID: req.query.orderId }, { $set: { status: "Cancelled" } });
        }

        console.log(data)
        res.redirect(`/oderdetail?id=${req.query.orderId}`)

    } catch (e) {
        console.log(e)
    }
}

const onlinePayemnt = async (req, res) => {
    try {
        req.session.address=req.body.addressPos;
        console.log("first online address ",req.body.addressPos);
        console.log('diiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
        const totalValue = await cartModel.aggregate([
            {
                $match: { userId: req.session.userId }
            },
            {
                $group: {
                    _id: "$proId",
                    totalPrice: { $sum: "$Price" },
                    totalQuantity: { $sum: "$Quantity" }
                }
            },
            {
                $project: {
                    _id: 1,
                    amount: {
                        $multiply: ["$totalPrice", "$totalQuantity"]
                    }
                }
            },
            {
                $group: {
                    _id: '',
                    sum: {
                        $sum: '$amount'
                    }
                }
            }
        ])
        totalAmount = totalValue[0].sum + 50;
        console.log(totalValue,'totalvalueeeeeeeeeeeeeeeeeeeeeeeeeee')
        console.log('hai')
        console.log(req.session.amount, '000000000000000000000000000000000000000rs')
        const amount = req.session.amount * 100
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'razorUser@gmail.com'
        }
        console.log(RAZORPAY_ID_KEY)
        console.log(RAZORPAY_SECRET_KEY)
        console.log('1')
        razorpayInstance.orders.create(options,
            (err, order) => {
                console.log('2');
                console.log(order)
                console.log(err)
                if (!err) {
                    res.status(200).send({
                        success: true,
                        msg: 'Order Created',
                        order_id: order.id,
                        amount: amount,
                        key_id: 'rzp_test_ClUZxn3BRreTaS',
                        // product_name: 'diya',
                        // description: 'req.body.description',
                        // contact: "8567345632",
                        // name: "Sandeep Sharma",
                        // email: "sandeep@gmail.com"
                    });
                }
                else {
                    // console.log(razorpayInstance.orders.create())
                    console.log(err, 'error in the online payment intagration')
                    res.status(400).send({ response: false, msg: 'Something went wrong!' });
                }
            }
        );
    } catch (e) {
        console.log(e)


    }
}
const retryOrder = async (req, res) => {
    try {
        const user=await userModel.findById(req.session.userId)
        const orderId = req.params.orderId;
        console.log("Attempting to retry order:", orderId);

        const order = await orderModel.findOne({ orderID: orderId });
        
        if (!order) {
            console.log("Order not found:", orderId);
            return res.status(404).json({ success: false, msg: "Order not found" });
        }

        console.log("Order found:", order);

        const amount = (order.totalOrderValue+50) * 100; // Convert to paise

        const options = {
            amount: amount,
            currency: "INR",
            receipt: user.Email
        };

        console.log("Creating Razorpay order with options:", options);

        razorpayInstance.orders.create(options, (err, razorpayOrder) => {
            if (err) {
                console.error("Razorpay order creation error:", err);
                return res.status(500).json({ success: false, msg: "Error creating Razorpay order", error: err.message });
              }
              console.log("Razorpay order created successfully:", razorpayOrder.id);
            res.json({
                success: true,
                key_id: 'rzp_test_ClUZxn3BRreTaS',
                amount: amount,
                description: `Retry payment for order ${orderId}`,
                name: user.Username,
                email: user.Email,
                contact: user.Number
            });
        });
    } catch (e) {
        console.error("Error in retryOrder:", e);
        res.status(500).json({ success: false, msg: "Internal server error", error: e.message });
    }
};


const retryPlaceOrder = async (req, res) => {
    try {
        const { orderId, payment_id, order_id, signature } = req.body;


        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderID: orderId },
            { 
                $set: {
                    status: "Pending",
                    "paymentDetails.razorpay_payment_id": payment_id,
                    "paymentDetails.razorpay_order_id": order_id,
                    "paymentDetails.razorpay_signature": signature
                }
            },
            { new: true }
        );
        updatedOrder.status="Pending";
        updatedOrder.save();
        


        if (updatedOrder) {
            res.json({ success: true, id: updatedOrder.orderID });
        } else {
            res.status(404).json({ success: false, message: "Order not found" });
        }
    } catch (e) {
        console.error("Error in retryPlaceOrder:", e);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const returnOder = async (req, res) => {
    try {
        console.log(req.query)
        const orderData = await orderModel.findOne({ orderID: req.query.orderId })
        const data = await orderModel.updateOne({ orderID: req.query.orderId, 'products.proId': req.query.id }, { $set: { 'products.$.userId': "Returned" } })
        let update = false;
        console.log(orderData)
        await orderModel.updateOne({ orderID: req.query.orderId }, { paymentStatus: 'refunded' });
        // Step 2: Add the refund amount to the user's wallet
        const product = orderData.products.find(product => product.proId === req.query.id);

        const refundAmount = product.Price*product.Quantity;
        const userId = orderData.user;  // Assuming orderData has a totalAmount field

        console.log(userId)
        console.log(refundAmount)

        const check = await userModel.updateOne(
            { Username: userId },
            { $inc: { wallet: refundAmount } }
        );
        console.log(check, '======================================');
        console.log(req.session.userId, '+++++++++++++++++++++++++++++++++++++++++++++++')
        const wallet = await walletModel.findOne({ userId: req.session.userId })
        console.log(wallet)
        const Transaction = [];
        const datas = {
            date: new Date(),
            type: `Credited for returning `,
            amount: refundAmount,
        }
        Transaction.push(datas)
        if (!wallet) {
            const newUser = new walletModel({
                userId: req.session.userId,
                wallet: refundAmount,
                walletTransactions: [datas],
            });
            const savedUser = await newUser.save();

            console.log(savedUser, '---------------------------------------')
        } else {
            await walletModel.updateOne(
                { userId: req.session.userId },
                {
                    $inc: { wallet: refundAmount },
                    $push: { walletTransactions: Transaction },
                }
            );
        }
        // }
        for (let i = 0; i < orderData.products.length; i++) {
            if (orderData.products[i].userId != "Cancelled") {
                update = true;
                await productModel.updateOne({ _id: orderData.products[i].proId }, { $inc: { stock: orderData.products[i].Quantity } });
            }
        }
        if (update) {
            await orderModel.updateOne({ orderID: req.query.id, 'products.proId': req.query.proId }, { $set: { 'products.$.userId': { status: "Returned" } } });
        }

        console.log(data)
        res.redirect(`/oderdetail?id=${req.query.orderId}`)



    } catch (e) {
        console.log(e)

    }
}
const walletAmmount = async (req, res) => {
    try {
        console.log("user entered wallet");
        let page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const userId = req.session.userId;
        const userData = await userModel.findById(userId);
        console.log("userData is::", userData);

        const wallet = await walletModel.aggregate([
            {
                $match: {
                    userId: userData._id,
                },
            },
            {
                $unwind: "$walletTransactions",
            },
            {
                $sort: {
                    "walletTransactions.date": -1,
                },
            },
            {
                $project: {
                    wallet: 1,
                    walletTransactions: 1,
                    _id: 0,
                },
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const totalTransactions = await walletModel.aggregate([
            {
                $match: {
                    userId: userData._id,
                },
            },
            {
                $project: {
                    transactionCount: { $size: "$walletTransactions" }
                }
            }
        ]);

        const totalPages = Math.ceil((totalTransactions[0]?.transactionCount || 0) / limit);
        const walletData = await walletModel.findOne({ userId: req.session.userId });

        console.log("Wallet data:", wallet);
        console.log("Total transactions:", totalTransactions);

        const templateData = {
            data: wallet.length > 0 ? wallet : [],
            totalPages,
            currentPage: page,
            walletBalance: walletData ? walletData.wallet : 0
        };

        console.log("Data being passed to template:", templateData);

        res.render('wallet', templateData);

    } catch (e) {
        console.log('Error in walletAmmount:', e);
        res.status(500).render('error', { message: "An error occurred while fetching wallet data" });
    }
}

const walletBalance = async (req, res) => {
    try {
        const { payment } = req.body;
        console.log(payment, 'Payment method');
        const cartData = await cartModel.find({ userId: req.session.userId });
        const addressData = await addressModel.findOne({ userId: req.session.userId });
        const userData = await userModel.findOne({ _id: req.session.userId });
        
        if (payment === 'wallet') {
            const wallet = await walletModel.findOne({ userId: req.session.userId });

            const orderId = otpGenerator.generate(16, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
                digits: true
            });

            let totalAmount = 0;

            if (cartData.length > 0) {
                const totalValue = await cartModel.aggregate([
                    {
                        $match: { userId: req.session.userId }
                    },
                    {
                        $group: {
                            _id: "$proId",
                            totalPrice: { $sum: "$Price" },
                            totalQuantity: { $sum: "$Quantity" }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            amount: {
                                $multiply: ["$totalPrice", "$totalQuantity"]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '',
                            sum: {
                                $sum: '$amount'
                            }
                        }
                    }
                ]);
                totalAmount = totalValue[0].sum;
            }
            
            console.log(totalAmount, 'total amount is showing');
            
            if (totalAmount <= wallet.wallet) {
                const Transaction = {
                    date: new Date(),
                    type: `Debited for purchase`,
                    amount: totalAmount,
                };
                
                const data = await walletModel.updateOne(
                    { userId: req.session.userId },
                    {
                        $inc: { wallet: -totalAmount },
                        $push: { walletTransactions: Transaction },
                    }
                );

                for (let i = 0; i < cartData.length; i++) {
                    cartData[i].userId = 'Pending';
                    await productModel.updateOne({ _id: cartData[i].proId }, { $inc: { stock: -cartData[i].Quantity } });
                }

                const orderData = new orderModel({
                    orderID: orderId,
                    user: userData.Username,
                    products: cartData,
                    totalOrderValue: totalAmount,
                    discount: req.session.amount || 0,
                    address: addressData.address[req.body.addressPos],
                    paymentMethod: req.body.payment,
                    date: new Date(),
                    status: "Pending",
                });

                await orderData.save();
                await cartModel.deleteMany({ userId: req.session.userId });
                
                res.json({ response: true, id: orderId });
            } else {
                res.json({ response: false, message: 'Insufficient balance to complete the purchase' });
            }
        }
    } catch (e) {
        console.log('Error in walletBalance:', e);
        res.status(500).json({ response: false, message: 'An error occurred' });
    }
}
const paymentFailed = async (req, res) => {
    try {

        const addressData = await addressModel.findOne({ userId: req.session.userId });
        const userData = await userModel.findOne({ _id: req.session.userId });
        const cartData = await cartModel.find({ userId: req.session.userId });
        const productData = await productModel.find({ proId: req.query.proId });
        for (let i = 0; i < cartData.length; i++) {
            console.log(i, 'for loop', cartData[i])
            cartData[i].userId = 'Pending';
            const productInfo = await productModel.updateOne({ _id: cartData[i].proId }, { $inc: { stock: -cartData[i].Quantity } })
            console.log(productInfo)
        }
        const totalValue = await cartModel.aggregate([
            {
                $match: { userId: req.session.userId }
            },
            {
                $group: {
                    _id: "$proId",
                    totalPrice: { $sum: "$Price" },
                    totalQuantity: { $sum: "$Quantity" }
                }
            },
            {
                $project: {
                    _id: 1,
                    amount: {
                        $multiply: ["$totalPrice", "$totalQuantity"]
                    }
                }
            },
            {
                $group: {
                    _id: '',
                    sum: {
                        $sum: '$amount'
                    }
                }
            }
        ])
        totalAmount = totalValue[0].sum;

        const orderId = otpGenerator.generate(16, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

    
        
  
        
        const orderData = new orderModel({
            orderID: orderId,
            user: userData.Username,
            products: cartData,
            totalOrderValue: totalAmount,
            discount: req.session.amount || 0,
            address:addressData.address[req.session.address],
            paymentMethod:"online",
            date: new Date(),
            status: "Payment Pending",
        })

        await orderData.save();

        const deleteCart = await cartModel.deleteMany({ userId: req.session.userId });
        console.log(deleteCart)
       
        res.redirect('/orderHistory');
    } catch (e) {
        console.log(e)

    }
}

const invoice = async (req, res) => {
    try {
        console.log("Invoice ---------->>>");
        console.log(req.query)
        const orderData = await orderModel.findOne({ orderID: req.query.id });
        console.log(req.query.id, '+++++++++++++++++++orderId')

        console.log("Order Data for invoice is: ", orderData);
        date = orderData.date;
        console.log("Date is :", date.toDateString());

        //--------------------------------------------------------//

        const num = `${orderData.totalOrderValue}`;
        const wordify = (num) => {
            const single = [
                "Zero",
                "One",
                "Two",
                "Three",
                "Four",
                "Five",
                "Six",
                "Seven",
                "Eight",
                "Nine",
            ];
            const double = [
                "Ten",
                "Eleven",
                "Twelve",
                "Thirteen",
                "Fourteen",
                "Fifteen",
                "Sixteen",
                "Seventeen",
                "Eighteen",
                "Nineteen",
            ];
            const tens = [
                "",
                "Ten",
                "Twenty",
                "Thirty",
                "Forty",
                "Fifty",
                "Sixty",
                "Seventy",
                "Eighty",
                "Ninety",
            ];
            const formatTenth = (digit, prev) => {
                return 0 == digit
                    ? ""
                    : " " + (1 == digit ? double[prev] : tens[digit]);
            };
            const formatOther = (digit, next, denom) => {
                return (
                    (0 != digit && 1 != next ? " " + single[digit] : "") +
                    (0 != next || digit > 0 ? " " + denom : "")
                );
            };
            let res = "";
            let index = 0;
            let digit = 0;
            let next = 0;
            let words = [];
            if (((num += ""), isNaN(parseInt(num)))) {
                res = "";
            } else if (parseInt(num) > 0 && num.length <= 10) {
                for (index = num.length - 1; index >= 0; index--)
                    switch (
                    ((digit = num[index] - 0),
                        (next = index > 0 ? num[index - 1] - 0 : 0),
                        num.length - index - 1)
                    ) {
                        case 0:
                            words.push(formatOther(digit, next, ""));
                            break;
                        case 1:
                            words.push(formatTenth(digit, num[index + 1]));
                            break;
                        case 2:
                            words.push(
                                0 != digit
                                    ? " " +
                                    single[digit] +
                                    " Hundred" +
                                    (0 != num[index + 1] && 0 != num[index + 2] ? " and" : "")
                                    : ""
                            );
                            break;
                        case 3:
                            words.push(formatOther(digit, next, "Thousand"));
                            break;
                        case 4:
                            words.push(formatTenth(digit, num[index + 1]));
                            break;
                        case 5:
                            words.push(formatOther(digit, next, "Lakh"));
                            break;
                        case 6:
                            words.push(formatTenth(digit, num[index + 1]));
                            break;
                        case 7:
                            words.push(formatOther(digit, next, "Crore"));
                            break;
                        case 8:
                            words.push(formatTenth(digit, num[index + 1]));
                            break;
                        case 9:
                            words.push(
                                0 != digit
                                    ? " " +
                                    single[digit] +
                                    " Hundred" +
                                    (0 != num[index + 1] || 0 != num[index + 2]
                                        ? " and"
                                        : " Crore")
                                    : ""
                            );
                    }
                res = words.reverse().join("");
            } else res = "";
            return res;
        };
        console.log(wordify(num));

        //------------------------------------------------------------------//

        // copy
        const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice</title>
          <style>
              /! tailwindcss v3.0.12 | MIT License | https://tailwindcss.com/,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input:-ms-input-placeholder,textarea:-ms-input-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none},:after,:before{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.flex{display:flex}.table{display:table}.table-cell{display:table-cell}.table-header-group{display:table-header-group}.table-row-group{display:table-row-group}.table-row{display:table-row}.hidden{display:none}.w-60{width:15rem}.w-40{width:10rem}.w-full{width:100%}.w-\[12rem\]{width:12rem}.w-9\/12{width:75%}.w-3\/12{width:25%}.w-6\/12{width:50%}.w-2\/12{width:16.666667%}.w-\[10\%\]{width:10%}.flex-1{flex:1 1 0%}.flex-col{flex-direction:column}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.justify-center{justify-content:center}.rounded-l-lg{border-top-left-radius:.5rem;border-bottom-left-radius:.5rem}.rounded-r-lg{border-top-right-radius:.5rem;border-bottom-right-radius:.5rem}.border-x-\[1px\]{border-left-width:1px;border-right-width:1px}.bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity))}.p-10{padding:2.5rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pl-4{padding-left:1rem}.pb-20{padding-bottom:5rem}.pb-16{padding-bottom:4rem}.pb-1{padding-bottom:.25rem}.pb-2{padding-bottom:.5rem}.pt-20{padding-top:5rem}.pr-10{padding-right:2.5rem}.pl-24{padding-left:6rem}.pb-6{padding-bottom:1.5rem}.pl-10{padding-left:2.5rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-bold{font-weight:700}.font-normal{font-weight:400}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity))}.text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity))}
          </style>
      </head>
      <body>
          <div class="p-10">
              <!--Logo and Other info-->
              <div class="flex items-start justify-center">
                  <div class="flex-1">
                      <div class="w-60 pb-6">
                         
                      </div>
                      
                      <div class="w-60 pl-4 pb-6">
                          <h3 class="font-bold">Bagdot</h3>
                          <p>12th cross, 80th feet Road</p>
                          <p>HSR Layout</p>
                          <p>Bangalore 560075</p>
                      </div>
                      
                      <div class="pl-4 pb-20">
                          <p class="text-gray-500">Shipping to:</p>
                          <h3 class="font-bold">${orderData.address.Name
            }</h3>
                          <h3>${orderData.address.Housename}, ${orderData.address.Streetname
            }, ${orderData.address.City}</h3>
                          <h3>${orderData.address.State}, ${orderData.address.Pincode
            } - ${orderData.address.Number}</h3>
                      </div>
                      
                  </div>
                  <div class="flex items-end flex-col">
      
                      <div class="pb-16">
                          <h1 class=" font-normal text-4xl pb-1">Invoice</h1>
                          <br><p class="text-right text-gray-500 text-xl"></p>
                          <p class="text-right text-gray-500 text-xl">#: ${orderData.orderID
            }</p>
                      </div>
      
                      <div class="flex">
                          <div class="flex flex-col items-end">
                              <p class="text-gray-500 py-1">Date: </p>
                              <p class="text-gray-500 py-1">Payment Method:</p>
                          </div>
                          <div class="flex flex-col items-end w-[12rem] text-right">
                              <p class="py-1">${date.toDateString()}</p>
                              <p class="py-1 pl-10">${orderData.paymentMethod}</p>
                              
                          </div>
                      </div>
                  </div>
              </div>
              
              <!--Items List-->
      <div class="table w-full">
                  <div class=" table-header-group bg-gray-700 text-white ">
                      <div class=" table-row ">
                          <div class=" table-cell w-6/12 text-left py-2 px-4 rounded-l-lg border-x-[1px]">Item</div>
                          <div class=" table-cell w-[10%] text-center border-x-[1px]">Qty</div>
                          <div class=" table-cell w-2/12 text-center border-x-[1px]">Unit Price</div>
                          
                          <div class=" table-cell w-2/12 text-center rounded-r-lg border-x-[1px]">Amount</div>
                      </div>
                  </div>
      
                  <div class="table-row-group">
                      ${getDeliveryItemsHTML(orderData)}
                  </div>
              </div>
              
              <!--Total Amount-->
             
              
               <div class=" pt-10 pr-10 text-right">
                  <p class="text-gray-400">Sub total: <span class="pl-24 text-black">₹${orderData.discount}
                </span></p>
              </div>
              <div class=" pt-10 pr-10 text-right">
                  <p class="text-gray-400">Status: <span class="pl-24 text-black">${orderData.status}
                </span></p>
              </div>
              
              <div class=" pt-20 pr-10 text-right">
                  <p class="text-gray-400">Total: <span class="pl-24 text-black">₹${orderData.discount
            }
                </span></p>
              </div>
  
              <div class=" pt-10 pr-10 text-left">
                  <p class="text-gray-400">Amount in Words: <span class="pl-24 text-black">${wordify(
                num
            )}</span></p>
              </div> 
      
              <!--Notes and Other info-->
              <div class="py-6">
              <br>
                  <p class="text-gray-400 pb-2">Notes: <span>Thanks for ordering with us.</span></p> </div>
      
              <div class="">
                  <p class="text-gray-400 pb-2">Terms: <span style="font-size:8px;">Invoice is Auto generated at the time of delivery,if there is any issue contact provider.</span></p>
                  
              </div>
          </div>
      </body>
      </html>
      `;

        function getDeliveryItemsHTML(orderData) {
            let data = "";
            orderData.products.forEach((value) => {
                data += `
      <div class="table-row">
          <div class=" table-cell w-6/12 text-left font-bold py-1 px-4">${value.product
                    }</div>
          <div class=" table-cell w-[10%] text-center">${value.Quantity
                    }</div>
          <div class=" table-cell w-2/12 text-center">₹${value.Price}</div>
          <div class=" table-cell w-2/12 text-center">₹${value.Price * value.Quantity
                    }</div>
      </div>
      `;
            });
            return data;
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        await page.emulateMediaType('screen');

        const pdfPath = 'report.pdf';
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' }
        });


        await browser.close();

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        fs.createReadStream(pdfPath).pipe(res);

        // Clean up the temporary PDF file
        fs.unlink(pdfPath, err => {
            if (err) throw err;
        });

    } catch (e) {
        console.log('error in the salesReport:', e);
       
    }
}



module.exports = {
    addNewAddress,
    checkoutPage,
    fetchAddress,
    placeOrder,
    orderPlacedSuccessful,
    orderHistory,
    oderDetails,
    cancelOder,
    onlinePayemnt,
    returnOder,
    walletAmmount,
    walletBalance,
    paymentFailed,
    retryOrder,
    retryPlaceOrder,
    invoice,

}