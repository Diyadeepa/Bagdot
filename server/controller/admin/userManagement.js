const userDetails = require('../../model/useModel');


const userManagementPage = async (req, res) => {
    try {
        const userData = await userDetails.find({ isAdmin: false }).sort({_id:-1});
        console.log(userData);
        res.render('adminUser', { data: userData })
    } catch (e) {
        console.log('error in the userManagementPage ', e);
        res.redirect('/admin/error');
    }
}

const changeStatus = async (req,res)=>{
    try{
        console.log(req.query.id)
        const userData = await userDetails.findOne({_id:req.query.id});
        if(userData.status){
            await userDetails.updateOne({_id:req.query.id},{status:false});
        }else{
            await userDetails.updateOne({_id:req.query.id},{status:true});
        }
        res.redirect('/admin/User');
    }catch(e){
        console.log('error in the changeStatus', e);
        res.redirect('/admin/error');
    }
}


module.exports = {
    userManagementPage,
    changeStatus
}