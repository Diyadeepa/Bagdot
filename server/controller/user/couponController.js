const { response } = require('express');
const couponModel = require('../../model/coupon')

const applyCoupon = async (req, res) => {
    console.log(req.body, 'coupon controller')
    const data = await couponModel.findOne({ name: req.body.code })
    console.log(data, 'coupon data');
    const amount = req.session.amount
    if (data) {
        console.log(data);
        if (data.expiry > new Date()) {
            if (amount >= data.minimum_cart_value) {
                let price = req.session.amount - data.discount
                req.session.a = req.session.amount
                req.session.amount = price 
                req.session.coupon = data.name
                res.json({ response: true, msg: 'Coupon Applied', amount: price, discount: data.discount });
            } else {
                res.json({ response: false, msg: `Minimum amount to purchase is :${data.minimum_cart_value} ` });
            }
        } else {
            res.json({ response: false, msg: 'Coupon code Expired!!' });
        }

    } else {
        res.json({ response: false, msg: 'Invalid coupon code!!!' });
    }


}

const removeCoupon = async (req, res) => {
    console.log(req.body)
    req.session.amount =  req.session.a
    req.session.coupon = null;
    res.json({response:true,msg:'coupon removed'})
}

// const displaycoupon =async(req,res)=>{
//     try{
//         const coupon= await couponModel.findOne({})
//         res.json({ response: true, data:coupon });
//     } catch (e) {
//         res.json({ response: false, msg: 'Failed to fetch coupons' })
// }
// }


module.exports = {
    applyCoupon,
    removeCoupon,
    // displaycoupon,
}