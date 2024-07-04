const userModel = require('../../model/useModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator')
const addressModel = require('../../model/addressModel')
const passport = require('passport')
require('dotenv').config()


const checkEmail = async (req, res) => {
    try {
        const data = await userModel.findOne({ Email: req.body.email })
        console.log(data)
        if (!data) {
            res.redirect('/')
        }
    } catch (e) {

    }
}

let userRegisterOTP
const sendMail = async (email) => {
    // let testAccount = await nodemailer.createTestAccount();

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "diyauday21@gmail.com",
            pass: "jjlx opgn kmom fjfs"
        }
    });

    const otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false
    });



    userRegisterOTP = otp

    var mailOptions = {
        from: 'Bagdot <"diyauday21@gmail.com">',
        to: email,
        subject: 'E-Mail Verification',
        text: 'Your OTP is:' + otp,
    };

    transporter.sendMail(mailOptions);
    // res.send("E-mail sent sucessfully")
    console.log("E-mail sent sucessfully");
    console.log(otp)

}

const userRegisterOTPPage = async (req, res) => {
    try {
        const userFound = await userModel.find({ Email: req.body.email });
        console.log(userFound, 'skdfjsdkdjfkasdhfsd------------------')
        if (userFound.length == 0) {
            sendMail(req.body.email);
            req.session.userRegisterDetails = req.body;
            console.log(userRegisterOTP, "userRegisterOTP")
            let login = false
            if (req.session.user) {
                login = true;
            }
            res.render('otp', { message: "", login: login })
        } else {
            res.redirect('/signup?message=user already exit')
        }
    } catch (e) {
        console.log('error in the userRegisterOTPPage :', e);
    }
}

const resendRegisterOTPValidation = async (req, res) => {
    try {
        let login = false
        if (req.session.user) {
            login = true;
        }
        sendMail(req.session.userRegisterDetails.email);
        res.render('otp', { message: "", login: login })
        //    res.redirect('/resend')
    } catch (e) {
        console.log(e)

    }
}

const userRegisterOTPValidation = async (req, res) => {
    try {
        if (req.body.otp === userRegisterOTP) {
            res.redirect('/userRegister')
        } else {
            let login = false
            if (req.session.user) {
                login = true;
            }
            res.render('otp', { message: "Invalid Otp", login: login })
        }
    } catch (e) {
        console.log('error in the userRegisterOTPValidation :', e)
    }
}


const userRegister = async (req, res) => {

    console.log(req.session.userRegisterDetails);
    try {
        const userFound = await userModel.find({ Email: req.session.userRegisterDetails.email });
        console.log(userFound);
        if (userFound.length == 0) {
            const hashPass = await bcrypt.hash(req.session.userRegisterDetails.password, 10);
            const user = new userModel({
                Username: req.session.userRegisterDetails.username,
                Email: req.session.userRegisterDetails.email,
                Number: req.session.userRegisterDetails.phone,
                Password: hashPass
            })

            await user.save();
            res.redirect('/login');
        }
        else {
            res.redirect('/signup?message=user already exit')
        }
    } catch (e) {
        console.log('error in the userRegister : ', e)
    }

}

const userCheck = async (req, res) => {
    try {
        console.log(req.body)
        const userFound = await userModel.find({ Email: req.body.email })
        console.log(userFound)
        if (userFound.length == 1) {
            const compass = await bcrypt.compare(req.body.password, userFound[0].Password)
            if (compass) {
                if (userFound[0].status) {
                    res.redirect('/login?msg=your access has been declined!')
                    console.log()
                } else {
                    req.session.user = true;
                    req.session.userId = userFound[0]._id;
                    res.redirect('/');
                }
            } else {
                res.redirect('/login?msg=Wrong password! ')
            }
        } else {
            res.redirect('/login?msg=Wrong email address! ')
        }
    } catch (e) {
        console.log('error in the userCheck : ', e);
    }
}

const forgotPassword = async (req, res) => {
    try {
        let login = false
        if (req.session.user) {
            login = true;

        } msg = req.query.msg || ""
        console.log('forgotPassword render');
        res.render('forgetPassword', { message: msg, login: login });

    } catch (e) {
        console.log('error in the forgotPassword :', e);
    }
}

const forgotPasswordSendOtp = async (req, res) => {
    try {
        const data = await userModel.find({ Email: req.body.email })
        console.log(data, '--------------------------------------------------------')
        console.log(req.body.email)
        if (data.length == 0) {
            res.redirect('/forgotPassword?msg=userNotFound')
        } else {
            console.log('forgotPasswordSendOtp');
            req.session.forgotEmail = req.body.email;
            console.log(req.body.email);
            sendMail(req.body.email);
            let login = false
            if (req.session.user) {
                login = true;
            }
            res.render('forgetPasswordotp', { message: "", login: login });
        }
    } catch (e) {
        console.log('error in the forgotPasswordSendOtp :', e)
    }
}

const forgotPasswordOtpVerification = (req, res) => {
    try {
        console.log('forgotPasswordOtpVerification')
        console.log(req.body.otp);
        console.log(userRegisterOTP)
        if (req.body.otp == userRegisterOTP) {
            console.log('if condtion')
            res.redirect('/forgotPasswordNew');
        } else {
            console.log('else conditinon')
            let login = false
            if (req.session.user) {
                login = true;
            }
            res.render('forgetPasswordotp', { message: "invalid otp", login, login })
        }

    } catch (e) {
        console.log('error in the forgotPasswordOtpVerification : ', e);
    }
}

const forgorPasswordNew = async (req, res) => {
    try {
        let login = false
        console.log('after otp redirect')
        if (!req.session.user) {
            login = true;

            res.render('forgetPasswordNewPassword', { login: login });
        }
    } catch (e) {
        console.log('error in the forgorPasswordNew : ', e);
    }
}


const forgorPasswordNewPost = async (req, res) => {
    try {

        console.log('forgorPasswordNewPost', '++++++++++++++++')
        const newPassword = req.body.pass
        const hashPass = await bcrypt.hash(newPassword, 10);
        console.log(hashPass)
        const userData = await userModel.findOne({ Email: req.session.forgotEmail })
        console.log(req.session.forgotEmail);
        console.log(userData);
        if (userData) {
            await userModel.updateOne({ Email: req.session.forgotEmail }, { Password: hashPass })
            res.redirect('/login?msg=password Changed Successfully')
        } else {
            console.log('no');
            res.redirect('/login?msg=Something went wrong, Pleace try again')
        }
        console.log(userData);
    } catch (e) {
        console.log('error in the forgorPasswordNewPost : ', e);
    }
}


const logout = async (req, res) => {
    try {
        req.session.user = false;
        await req.session.destroy();
        res.redirect('/');
    } catch (e) {
        console.log('error in the logout : ', e);
    }
}
const userprofile = async (req, res) => {
    try {

        const userData = await userModel.findById({ _id: req.session.userId })
        console.log(userData)
        res.render('userProfile', { data: userData });
    } catch (e) {

    }
};

const updateUser = async (req, res) => {
    try {
        const { username, phone } = req.body;
        const userId = req.session.userId;
        const user = await userModel.findById(userId);
        user.Username = username;
        user.Number = phone;
        await user.save();
        res.redirect('/profile?message=Profile updated successfully');
    } catch (e) {
        console.error('Error updating user profile:', e);
        res.redirect('/profile?error=1');
    }
};


const displayAddress = async (req, res) => {
    try {
        const data = await addressModel.findOne({ userId: req.session.userId });
        console.log(data)
        res.render('userAddressLists', { data: data });
    } catch (e) {

    }
}

const displayAddAddress = async (req, res) => {
    try {
        res.render('userAddress');

    } catch (e) {
        console.log('error in the displayAddAddress : ', e);
    }
}

const addAddressPost = async (req, res) => {
    try {
        console.log(req.body, 'addaddressPost');
        console.log(req.session.userId)
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

        res.redirect('/adderss')
    } catch (e) {
        console.log('error in the addAddressPost', e);
    }
}

const deleteAddress = async (req, res) => {
    try {
        console.log(req.query.pos, ',.,.,.,.,.,.,.,/./././././././.')
        const userAddress = await addressModel.findOne({ userId: req.session.userId });
        const addressData = userAddress.address[req.query.pos];
        const result = await addressModel.updateOne(
            { _id: userAddress._id },
            { $pull: { address: addressData } }
        )
        console.log(result)
        res.redirect('/adderss')
    } catch (e) {
        console.log('error in the deleteAddress : ', e)
    }
}

const editAddress = async (req, res) => {
    try {
        console.log(req.query.pos)
        const userAddress = await addressModel.findOne({ userId: req.session.userId })
        const userAddressData = userAddress.address[req.query.pos];
        console.log(userAddressData);
        res.render('userEditAddress', { data: userAddressData })

    } catch (e) {

    }
}

const editAddressPost = async (req, res) => {
    try {

        const result = await addressModel.updateOne({
            userId: req.session.userId, 'address._id': req.query.id
        },
            {
                $set: {
                    'address.$.SaveAs': req.body.saveas,
                    'address.$.Name': req.body.name,
                    'address.$.Email': req.body.email || "",
                    'address.$.Number': req.body.mobile,
                    'address.$.Housename': req.body.housename,
                    'address.$.Streetname': req.body.street,
                    'address.$.Pincode': req.body.pincode,
                    'address.$.City': req.body.city,
                    'address.$.State': req.body.state,
                    'address.$.Country': req.body.country,
                }
            }
        )

        console.log(result, ',,,,,,,,,,>>>>>>>>>>>>>>>????????????')
        res.redirect('/adderss')


    } catch (e) {
        console.log('editAddressPost error : ', e);
    }
}

const changePassword = async (req, res) => {
    try {
        res.render('userChangepassword', { error: '' })
    } catch (e) {
        console.log(e)
    }
}

const changepasswordPost = async (req, res) => {
    const { Oldpassword, NewPassword, confirmPassword } = req.body;
    console.log(req.body)

    try {
        console.log('try enter')
        // Find the user by ID
        const user = await userModel.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login'); // Redirect to login if user not found
        }
        console.log('user found', user, ';,./,./,./,./,././,././,/.,')
        console.log(Oldpassword)
        // Compare old password
        const isPasswordValid = await bcrypt.compare(Oldpassword, user.Password);
        console.log(isPasswordValid, 'jsjkdfabdsvawjdsn;,.,,.,,,.,.,.')
        if (!isPasswordValid) {
            console.log('if')

            res.render('userChangepassword', { error: 'Old password is incorrect' });

        } else if (NewPassword !== confirmPassword) {
            console.log('else if')

            res.render('userChangepassword', { error: 'New password and confirm password do not match' });

        } else {
            console.log('else')

            console.log('password is valid')
            // Validate new password


            // Hash the new password
            const hashedPassword = await bcrypt.hash(NewPassword, 10);

            // Update user's password in the database
            user.Password = hashedPassword;
            await user.save();
            req.session.destroy()
            res.redirect('/'); // Redirect to profile page or any other page after successful password change

        }

    } catch (error) {
        console.error('Error changing password:', error);
        // res.render('changePassword', { error: 'Something went wrong. Please try again.' });
    }
}


// Google SignIn
// const googleSignIn = passport.authenticate('google', {
//     scope: ['email', 'profile']
// });

// const googleCallback = passport.authenticate('google',
// {
//     successRedirect: '/',
//     failureRedirect: '/auth/failure'
// })

// const authFailure = (req, res) => {
//     res.send('Something went wrong ---------->> ');
// };

//     async function (req, res) {
//         const user = req.user

//         const userData = {
//             name: user.displayName,
//             email: user.emails[0].value
//         }


//         try {
//             const alreadyLoginUserData = await userModel.findOne({ email: userData.email })
//             if (alreadyLoginUserData) {
//                 if (alreadyLoginUserData.status == false) {

//                     // req.session.isUser = false;
//                     // req.flash('error', 'Admin Blocked You');


//                     req.session.user = false;
//                     // req.session.userId = userFound[0]._id;



//                     return res.redirect('/login')
//                 } else {
//                     req.session.isUser = alreadyLoginUserData
//                     res.redirect('/');
//                 }

//             } else {
//                 const createdUser = await collection.create(userData);
//                 req.session.isUser = createdUser
//                 res.redirect('/');
//             }

//         } catch (error) {
//             console.error(error);
//             res.status(500).send('Internal Server Error');
//         }

// });

// const authFailure = (req, res) => {
//     res.send('Something went wrong ---------->> ');
// };




module.exports = {
    userRegister,
    userCheck,
    sendMail,
    userRegisterOTPValidation,
    userRegisterOTPPage,
    resendRegisterOTPValidation,
    forgotPassword,
    forgotPasswordSendOtp,
    forgotPasswordOtpVerification,
    forgorPasswordNew,
    forgorPasswordNewPost,
    logout,
    userprofile,
    updateUser,
    displayAddress,
    addAddressPost,
    displayAddAddress,
    deleteAddress,
    editAddress,
    editAddressPost,
    changepasswordPost,
    changePassword,
    checkEmail,
    // googleSignIn,
    // googleCallback,
    // authFailure
}