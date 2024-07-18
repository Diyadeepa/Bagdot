const userModel = require('../model/useModel')

const isLogin = async (req, res, next) => {
    try {

        if (!req.session.user) {

            console.log('admin session expired')
            res.redirect('/');

        }
        let userStatus = await userModel.findOne({ _id: req.session.userId })
        console.log(userStatus, '//////////////////////////////////////-------------------------')
        if (!userStatus.status) {
            next()
        } else {
            req.session.user = false;
            await req.session.destroy();
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const errorPage = (req, res) => {
    try {
        res.render('errorPageUser')
    } catch (e) {
        console.log('error in the errorPage : ', e)
    }
}


module.exports = {
    isLogin,
    errorPage,
}