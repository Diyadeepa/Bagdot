const { response } = require('express');
const cartModel = require('../../model/cartModel')
const productModel = require('../../model/productModel');

const addCart = async (req, res) => {
    try {
        console.log(req.query.proId)
        let findData = await productModel.findOne({ _id: req.query.proId })
        console.log(findData)
        const cartData = await cartModel.findOne({ proId: req.query.proId });
        console.log(cartData, 'cartDatacartDatacartDatacartDatacartData')
        if (cartData) {
            console.log('cartdata found')
            if (cartData.Quantity < 5 && cartData.Quantity + 1 <= findData.stock) {
                const quantityToAdd = Math.min(5 - cartData.Quantity, findData.stock - cartData.Quantity);
                await cartModel.updateOne(
                    { _id: cartData._id },
                    { $inc: { Quantity: quantityToAdd } }
                );
            }

        } else if(findData.stock) {
            const newProduct = new cartModel({
                userId: req.session.userId,
                product: findData.product,
                Image: findData.image[0].path,
                Price: findData.price,
                Quantity: 1,
                proId: req.query.proId,
            })
            await newProduct.save()
            console.log('cartdata not found')
        }
        console.log()
        res.redirect('/cart')
    } catch (e) {
        console.log(e)
    }
}


const removeFromCart = async (req, res) => {
    try {
        const data = await cartModel.deleteOne({ _id: req.query.id });
        console.log(data)
        res.redirect('/cart')

    } catch (e) {
        console.log('error in the removeFromCart :', e)
    }
}


const displayCart = async (req, res) => {
    try {
        const cartData = await cartModel.find({ userId: req.session.userId })
        console.log("cart le data",cartData)

        // const cart = await cartModel.aggregate([
        //     {
        //         $lookup:{
        //             from:"products",
        //             localField:"proId",
        //             foreignField:"_id",
        //             as:"ProductData"
        //         }
        //     }
        // ])

        // console.log(cart,'././././,/,/.,/,p,pl,lsdfojasjfj')
        let totalAmount = 0

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
            ])
            totalAmount = totalValue[0].sum;

        }

        console.log(cartData)
        console.log("before render")
        res.render('cart', { data: cartData, amount: totalAmount })
    } catch (e) {
        console.log(e)
    }
}

const changeQuantity = async (req, res) => {
    try {
        console.log(req.body)

        const cartData = await cartModel.findOne({ userId: req.session.userId, product: req.body.name })
        console.log(cartData)

        const Quantity = cartData.Quantity + parseInt(req.body.count);

        const productData = await productModel.findOne({ _id: cartData.proId });
        console.log(productData, '/././././/../../././././././././././././././.../.')

        if (Quantity  <= productData.stock) {


            if (Quantity > 0 && Quantity < 6) {
                const updateCheck = await cartModel.updateOne({ $and: [{ userId: req.session.userId }, { product: req.body.name }] }, { $inc: { Quantity: req.body.count } })
                console.log(updateCheck)

            }
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
        let totalPrice = totalValue[0].sum

        const cartQuantity = await cartModel.findOne({ userId: req.session.userId, product: req.body.name })
        let quantity = cartQuantity.Quantity
        let price = cartQuantity.Quantity * cartQuantity.Price;



        if (Quantity > productData.stock) {
            res.json({ response: false, quantity, price, totalPrice })
        } else {

            res.json({ response: true, quantity, price, totalPrice })
        }


    } catch (e) {
        console.log('error in the changeQuantity', e);
    }
}


module.exports = {
    addCart,
    displayCart,
    changeQuantity,
    removeFromCart

}
