var express = require('express');
const userController = require('../../controller/user/userController')
const productController = require('../../controller/user/productManagement');
const userAuth = require('../../middleware/userAuth')
const { route } = require('../admin.js/admin');
const { rawListeners } = require('../../model/useModel');
const cartMangament = require('../../controller/user/cart');
const whishlistMangament = require('../../controller/user/whishList')
const orderMangament = require('../../controller/user/orderController');
const couponController = require('../../controller/user/couponController');
require('../../../googleAuth')
const passport = require('passport')




var router = express.Router();

// userSide product display
router.get('/', productController.displayHomeData);
router.get('/product/:id', productController.productDetail)

// category wise product display;
router.get('/category/', productController.categoryWiseProduct);

router.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        console.log(req.query.msg)
        res.render('login', { msg: req.query.msg })
    }
})

router.post('/login', userController.userCheck)

router.get('/signup', (req, res) => {
    res.render('userSignup', { message: req.query.message });
})



router.post('/signup', userController.userRegisterOTPPage)
router.get('/resend', userController.resendRegisterOTPValidation)

router.post('/otpVerification', userController.userRegisterOTPValidation)

router.get('/userRegister', userController.userRegister)

router.get('/otp', userAuth.isLogin, (req, res) => {
    res.render('otp')
})

// Google 
// Google SignIn
router.get('/googleSignIn', passport.authenticate('google', {
    scope: ['email', 'profile']
}));

router.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/auth/failure'
}), async (req, res) => {
    // console.log(req.user);
    console.log('anything');
    console.log(req.user, 'user is shwoin google is working');
    req.session.userId = req.user._id
    console.log(req.session.USER_ID, 'userid is showing  whattttttttttttttttttt')
    // console.log(req.user,'req.user is working or not');
    req.session.user = true
    res.redirect('/')
    // console.log(req.user);
}
);

router.get('/auth/failure', (req, res) => {
    res.send('Something went wrong ---------->> ');
});


router.get('/addCart', userAuth.isLogin, cartMangament.addCart)
router.get('/cart', userAuth.isLogin, cartMangament.displayCart)
router.get('/removeFromCart', userAuth.isLogin, cartMangament.removeFromCart)

//change quentity
router.post('/changeQuantity', userAuth.isLogin, cartMangament.changeQuantity)


router.get('/account', userAuth.isLogin, (req, res) => {
    res.render('userAccount')
})
router.get('/adderss', userAuth.isLogin, userController.displayAddress)
router.get('/addNewAddress', userAuth.isLogin, userController.displayAddAddress)
router.post('/addaddressPost', userAuth.isLogin, userController.addAddressPost)
router.get('/deleteAddress', userAuth.isLogin, userController.deleteAddress)
router.get('/editAddress', userAuth.isLogin, userController.editAddress)
router.post('/editAddressPost', userAuth.isLogin, userController.editAddressPost)

router.get('/whishlist', userAuth.isLogin, whishlistMangament.displaywhishlist)
router.get('/addWhishlist', userAuth.isLogin, whishlistMangament.addTowhishlist)
router.get('/wishlistRemove', userAuth.isLogin, whishlistMangament.removeWishlist)

// chcek out page render
router.get('/checkout', userAuth.isLogin, orderMangament.checkoutPage)
// add new delivery address from checkout
router.post('/addaddressDeliveryAddress', userAuth.isLogin, orderMangament.addNewAddress)

//place order router
router.post('/placeOrder', userAuth.isLogin, orderMangament.placeOrder)
router.post('/onlineOrder', userAuth.isLogin, orderMangament.onlinePayemnt)
router.get('/orderPlacedSuccessful', userAuth.isLogin, orderMangament.orderPlacedSuccessful)
router.get('/orderHistory', userAuth.isLogin, orderMangament.orderHistory)
router.get('/oderdetail', userAuth.isLogin, orderMangament.oderDetails)
router.get('/cancelOrder', userAuth.isLogin, orderMangament.cancelOder)
router.get('/returnOder', userAuth.isLogin, orderMangament.returnOder)
router.get('/wallet', userAuth.isLogin, orderMangament.walletAmmount)
router.post('/checkWalletBalance', userAuth.isLogin, orderMangament.walletBalance)
router.get('/paymentFailed',userAuth.isLogin,orderMangament.paymentFailed)
router.get('/invoice',userAuth.isLogin,orderMangament.invoice)
router.post("/retryOrder/:orderId", userAuth.isLogin, orderMangament.retryOrder)
router.post("/retryPlaceOrder", userAuth.isLogin, orderMangament.retryPlaceOrder);

//coupon

router.post('/applyCoupon', userAuth.isLogin, couponController.applyCoupon)
router.post('/removeCoupon', userAuth.isLogin, couponController.removeCoupon);



router.get('/changepassword', userAuth.isLogin, userController.changePassword)
router.post('/changepasswordPost', userAuth.isLogin, userController.changepasswordPost)



router.get('/profile', userController.userprofile)
router.post('/profile', userController.updateUser)

router.post('/serachProduct', productController.serachProduct)



// forgot password routers

router.get('/forgotPassword', userController.forgotPassword);
router.post('/forgotPassword', userController.forgotPasswordSendOtp);
router.post('/forgotPasswordOtpVerification', userController.forgotPasswordOtpVerification)
router.get('/forgotPasswordNew', userController.forgorPasswordNew)
router.post('/forgotPasswordNew', userController.forgorPasswordNewPost)


// logout
router.get('/logout', userController.logout);

router.post('/fetchAddress', orderMangament.fetchAddress)

module.exports = router