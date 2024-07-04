const orderModel = require('../../model/orderModel');

const displayOrderPage = async (req, res) => {
    try {
        const orderData = await orderModel.find({}).sort({_id:-1});
        res.render('adminOders', { data: orderData });
    } catch (e) {
        console.log('error in the displayOrderPage : ', e);
    }
}

const orderDetails = async (req, res) => {
    try {
        console.log(req.query.id)
        const orderData = await orderModel.findOne({ _id: req.query.id })
        console.log(orderData)
        res.render('adminOrderDetails', { data: orderData });

    } catch (e) {
        console.log('error in the orderDetails : ', e);
    }
}

const updateStatus = async (req, res) => {
    try {
        console.log(req.body)
        console.log(req.query)
        const orderData = await orderModel.findById(req.query.id);
        if (req.body.orderStatus == "Delivered") {
            let count = 1;
            for (let i = 0; i < orderData.products.length; i++) {
                if(orderData.products[i].userId == "Delivered"){
                    count++
                }
            }
            console.log(count,'.................................................................')
            if(count == orderData.products.length){
                await orderModel.updateOne({_id:req.query.id},{$set:{status:"Delivered"}});
            }

        }
        const data = await orderModel.updateOne({ _id: req.query.id, 'products.proId': req.query.proId }, { $set: { 'products.$.userId': req.body.orderStatus } })
        console.log(data)
        console.log(req.body.orderStatus,'===================================order')
        
        res.redirect(`/admin/orderDetails?id=${req.query.id}`);
    } catch (e) {
        console.log('error in the updateStatus : ', e);
    }
}


module.exports = {
    displayOrderPage,
    orderDetails,
    updateStatus,
    
}