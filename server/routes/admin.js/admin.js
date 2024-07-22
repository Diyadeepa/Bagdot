const express = require('express')
const adminController = require('../../controller/admin/adminController')
const userManagementController = require('../../controller/admin/userManagement')
const catergoryMangement = require('../../controller/admin/catergoryManagement')
const productManagement = require('../../controller/admin/productManagement');
const adminLogin = require('../../middleware/adminAuth')
const storage = require('../../middleware/multer')
const errorPage = require('../../middleware/adminAuth')
const orderModel = require('../../controller/admin/orderManagement');
const couponMangement = require('../../controller/admin/adminCouponMangament')
const couponController = require('../../controller/admin/adminCouponMangament')

var router = express.Router()

router.get('/', adminController.admin)

router.post('/', adminController.checkAdmin)

router.get('/adminHome', adminLogin.isLogin, adminController.adminHome)
//sales report
router.post('/salesReport', adminLogin.isLogin, adminController.salesReport)

//chart data of admin dashboard
router.get("/sales_data", adminLogin.isLogin, adminController.getSalesData);






router.get('/Coupones-add', (req, res) => {
    res.render('adminCoupones-add')
})

// order management routers

router.get('/orders', adminLogin.isLogin, orderModel.displayOrderPage)

// order detial page
router.get('/orderDetails', adminLogin.isLogin, orderModel.orderDetails)
router.post('/updateStatus', adminLogin.isLogin, orderModel.updateStatus)


// user mangment
router.get('/User', adminLogin.isLogin, userManagementController.userManagementPage)
router.get('/changeStatus', adminLogin.isLogin, userManagementController.changeStatus)

//catergory managment
router.get('/Category', adminLogin.isLogin, catergoryMangement.getCategory)
router.get('/categoryStatus', adminLogin.isLogin, catergoryMangement.changeStatus)
router.post('/editCategory', catergoryMangement.editCategory)
router.post('/category', catergoryMangement.addCategory)

// product management
router.get('/Product', adminLogin.isLogin, productManagement.getProduct)
router.get('/Product-add', adminLogin.isLogin, productManagement.productAddPage)
router.post('/addProduct', storage.array('image', 5), productManagement.addProduct)
router.get('/productstatus', adminLogin.isLogin, productManagement.changeStatus)
router.get('/productPage', adminLogin.isLogin, productManagement.productPagenation);
router.post('/editProduct/:id', storage.array('image', 5), productManagement.editProduct)
router.get('/deleteImage', adminLogin.isLogin, productManagement.deleteImage)


router.get("/coupon", adminLogin.isLogin, couponController.coupon);
router.post("/addCoupon", adminLogin.isLogin, couponController.addCoupon);
router.post("/couponEdit/:id", adminLogin.isLogin, couponController.couponEdit);
router.post("/edit-coupon-save", adminLogin.isLogin, couponController.saveEditCoupon);
router.get("/removeCoupon", adminLogin.isLogin, couponController.deleteCoupon);




router.get('/logout', adminController.adminLogout)

// error page loaded;
router.get('/error', errorPage.errorPage)


module.exports = router