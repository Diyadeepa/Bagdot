const couponModel = require('../../model/coupon')
const userModel = require('../../model/useModel')



const coupon = async (req, res) => {
    try {
        console.log("COUPON ADMIN PAGE");
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 5;

        console.log(req.query.msg);
        if (!req.query.msg) {
            couponError = "";
        } else {
            couponError = req.query.msg;
        }
        const couponData = await couponModel
            .find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ _id: -1 });

        console.log("couponData is: ", couponData);

        const couponLength = await couponModel.find({});
        const length = couponLength.length;
        const totalPages = Math.ceil(length / limit);
        res.render("adminCoupons", {
            name: req.session.adminName,
            couponData,
            couponError,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.log("Error occurred while coupon in couponController");
    }
};

const addCoupon = async (req, res) => {
    try {
        console.log("Admin adding coupon--->");
        console.log("Entered values by Admin: ", req.body);
        console.log(req.body.discount);
        console.log(typeof req.body.discount);
        console.log(req.body.minCartValue);
        console.log(req.body.expiry);

        // ************************** //
        // const date = new Date();
        // let day = date.getDate();
        // let month = date.getMonth() + 1;
        // let year = date.getFullYear();
        // let date1 = `${day}-${month}-${year}`;
        // console.log("DATE IS:", date1);
        // let currentDate = new Date().toJSON().slice(0, 10);
        //console.log("currentDate is: ", currentDate);
        // *************************** //

        const couponFound = await couponModel.find({
            name: req.body.couponName,
        });
        console.log("Is there already this coupon available? ", couponFound);
        console.log(couponFound.length);
        if (couponFound.length == 1) {
            res.redirect("/admin/coupon?msg= Coupon already available");
        }
        if (couponFound.length === 0) {
            console.log("aaaaaaaaaa");
            if (Number(req.body.minCartValue) > Number(req.body.discount)) {
                console.log("bbbbbbbbbbbb");
                const newCoupon = new couponModel({
                    name: req.body.couponName,
                    // expiry: new Date(req.body.expiry),
                    expiry: req.body.expiry,
                    discount: req.body.discount,
                    minimum_cart_value: req.body.minCartValue,
                });
                await newCoupon.save();
                res.redirect("/admin/coupon?msg=Coupon added");
            } else if (Number(req.body.minCartValue) < Number(req.body.discount)) {
                console.log("ccccccccccc");
                res.redirect("/admin/coupon?msg= Discount should be smaller value");
            }
        }
    } catch (error) {
        console.log("Error occurred while addCoupon in couponController");
    }
};

const couponEdit = async (req, res) => {
    try {
        console.log("ADMIN: Coupon EDit page");
        const couponID = req.params.id;
        console.log(couponID);
        req.session.couponID = couponID;
        const couponData = await couponModel.findOne({ _id: couponID });
        console.log("Details of the couponID:", couponData);
        res.render("admin_coupon_edit", {
            name: req.session.adminName,
            couponData,
            err: '',
        });
    } catch (error) {
        console.log("error happened between couponEdit in couponController");
    }
};

const saveEditCoupon = async (req, res) => {
    try {
        console.log("Saving Edited Coupon");
        console.log(req.session.couponID);
        console.log("New coupon details: ", req.body);
        console.log(req.body.newExpiry - new Date())
        const givenDate = new Date(req.body.newExpiry);
        console.log(givenDate < new Date(), '---------------------------')
        if (givenDate < new Date()) {

            const couponData = await couponModel.findOne({ _id: req.session.couponID });
            console.log("Details of the couponID:", couponData);
            res.render("admin_coupon_edit", {
                name: req.session.adminName,
                couponData,
                err: 'invalid date'
            });

            console.log('if')


        } else {
            // if(req.body.newExpiry - new Date())
            if (Number(req.body.newDiscount) > Number(req.body.newMinCartValue)) {
                //res.redirect("/admin/coupon?msg= Discount should be smaller value");
                console.log("This should validate by throwing an error.");

                const couponData = await couponModel.findOne({ _id: req.session.couponID });
                console.log("Details of the couponID:", couponData);
                res.render("admin_coupon_edit", {
                    name: req.session.adminName,
                    couponData,
                    err: 'Cart value should be more than discount value'
                });

                console.log('if')
            } else if (Number(req.body.newDiscount) < Number(req.body.newMinCartValue)) {
                console.log("Update coupon here then.");
                await couponModel.updateOne(
                    { _id: req.session.couponID },
                    {
                        $set: {
                            name: req.body.newCouponName,
                            expiry: req.body.newExpiry,
                            discount: req.body.newDiscount,
                            minimum_cart_value: req.body.newMinCartValue,
                        },
                    }
                );
                console.log("COUPON UPDATED");
                res.redirect("/admin/coupon?msg= Coupon updated");

            }
            // let a = 
            // console.log(typeof a)
            // console.log(typeof req.body.newMinCartValue)

        }




    } catch (error) {
        console.log(
            "Error happened between saveEditCoupon in couponcontroller",
            error
        );
    }
};

const deleteCoupon = async (req, res) => {
    try {
        console.log("DELETING COUPON");
        const couponID = req.query.id;
        console.log(couponID);
        await couponModel.deleteOne({ _id: couponID });
        console.log("COUPON DELETED BY ADMIN");
        //   res.status(200).json({ success: true, message: "Coupon deleted" });
        res.redirect('/admin/coupon?msg=Coupon Deleted')
        // console.log(req.body);
        // res.json({
        //   name: "abc",
        // });
    } catch (error) {
        console.log("Error while deleteCoupon in couponController", error);
    }
};

const userApplyCoupon = async (req, res) => {
    try {
        console.log("userApplyCoupon");
        const date = new Date();
        const shipping_charges = 1000;
        const cart_amount = req.session.ShoppingCartAmount + shipping_charges;
        console.log(
            "req.session.ShoppingCartAmount",
            req.session.ShoppingCartAmount
        );
        console.log("cart_amount including delivery", cart_amount);
        //-----------------------------------------------------------------------------//
        //const total_cart_value = cart_amount + shipping_charges;
        console.log(" USER APPLYING A COUPON IN CHECKOUT PAGE ");
        console.log("today's date is:", date);
        // req.body(from fetch api) is consoled  //
        console.log(req.body.name);
        req.session.user_Applied_Coupon = req.body.name;
        console.log(req.body.value);
        // // //
        const couponFound = await couponModel.find({
            name: req.body.name,
        }); // to check whether such a coupon is available in DB //
        console.log("Is this coupon available now?", couponFound);

        if (couponFound.length == 0) {
            console.log("USER ENTERED A WRONG COUPON");
            res.json({
                message: "Invalid coupon entered",
                discount: "",
                total_cart_value: cart_amount,
                buttonChange: 0,
            });
        } else {
            console.log("USER ENTERED A CORRECT COUPON");

            //   // ********************** //
            if (couponFound[0].expiry < date) {
                console.log("Coupon Expired");
                res.json({
                    message: "This coupon is expired",
                    total_cart_value: cart_amount,
                    discount: "",
                    buttonChange: 0,
                });
            }
            //   // ********************** //

            const couponUsed = await userModel.find({
                username: req.session.name,
                coupon: { $in: `${req.body.name}` },
            }); // to check whether the user has already used this coupon //
            console.log("Does user already used this?", couponUsed);
            if (couponUsed.length == 1) {
                console.log("USER HAS ALREADY USED THIS COUPON EARLIER");
                // const cart_amount = req.session.cartTotal + shipping_charges;
                res.json({
                    message: "You have already used this coupon",
                    total_cart_value: cart_amount,
                    discount: "",
                    buttonChange: 0,
                });
            } else if (couponUsed.length == 0) {
                //const couponFound = await couponModel.find({ name: req.body.name }); // to check whether such a coupon is available in DB //
                console.log("USER HAS NOT USED THIS COUPON BEFORE");
                console.log(
                    "Minimum cart value to apply this coupon   ",
                    couponFound[0].minimum_cart_value
                );
                console.log("Cart total is: ", req.session.ShoppingCartAmount);
                if (
                    req.session.ShoppingCartAmount < couponFound[0].minimum_cart_value
                ) {
                    res.json({
                        message:
                            "Minimum cart value should be " +
                            `${couponFound[0].minimum_cart_value}` +
                            " for this coupon",
                        total_cart_value: cart_amount,
                        discount: "",
                        buttonChange: 0,
                    });
                } else if (
                    req.session.ShoppingCartAmount >= couponFound[0].minimum_cart_value
                ) {
                    //       // await userModel.updateOne(
                    //       //   { username: req.session.name },
                    //       //   { $push: { coupon: couponFound[0].name } }
                    //       // );
                    console.log("111&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                    console.log("Coupon when added is:", couponFound[0].name);
                    req.session.couponUserUSed = couponFound[0].name;
                    console.log("111&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                    const discount = couponFound[0].discount;
                    console.log("Discount amount is: ", discount);
                    console.log("Cart total is: ", req.session.ShoppingCartAmount);

                    const cart_amount =
                        req.session.ShoppingCartAmount + shipping_charges - discount;
                    console.log(
                        "Updated Cart value after discount from coupon is: ",
                        cart_amount
                    );

                    req.session.cart_Value_after_coupon = cart_amount;

                    //       // const total_cart_value = cart_amount + shipping_charges;
                    //       // console.log(
                    //       //   "Cart value including shipping charges: ",
                    //       //   total_cart_value
                    //       // );
                    res.header("Content-Type", "application/json").json({
                        message: "Coupon applied",
                        total_cart_value: cart_amount,
                        discount: discount,
                        buttonChange: 1,
                    });
                }
            }
        }
    } catch (error) {
        console.log(
            "Error happened while userApplyCoupon in couponController:",
            error
        );
    }
};

const userRemoveCoupon = async (req, res) => {
    try {
        console.log(" USER REMOVING THE APPLIED COUPON ");
        console.log(req.body.name);
        console.log(req.body.value);
        console.log(req.session.name);
        const couponFound = await couponModel.find({
            name: req.body.name,
        });
        console.log(couponFound);
        const removeCoupon = await userModel.updateOne(
            {
                username: req.session.name,
            },
            { $pull: { coupon: req.body.name } }
        );
        console.log(removeCoupon);
        const discount = couponFound[0].discount;
        const cart_value = req.session.cart_Value_after_coupon + discount;

        console.log("The total cart value after removing coupon: ", cart_value);

        res.header("Content-Type", "application/json").json({
            message: "Coupon removed",
            total_cart_value: cart_value,
            discount: "",
            buttonChange: 0,
        });
    } catch (error) {
        console.log("Error happened while userRemoveCoupon in couponController");
    }
};

module.exports = {
    coupon,
    addCoupon,
    couponEdit,
    saveEditCoupon,
    deleteCoupon,
    userApplyCoupon,
    userRemoveCoupon,
};