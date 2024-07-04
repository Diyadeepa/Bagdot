const productModel = require('../../model/productModel');
const whishlistModel = require('../../model/whishlistModel');

const addTowhishlist = async (req, res) => {
    try {
        console.log(req.query.proId);
        let findData = await productModel.findOne({ _id: req.query.proId });
        console.log(findData);
        
        const existingWishlistData = await whishlistModel.findOne({proId:req.query.proId, userId: req.session.userId});
        console.log(existingWishlistData);
        
        if(existingWishlistData){
            console.log('Product already exists in the wishlist');
            if(existingWishlistData.Quantity < 1) { 
                await whishlistModel.updateOne(
                    {_id: existingWishlistData._id},
                    {$inc: { Quantity: 1 } }
                );
            }
            res.redirect('/whishList');
        } else {
            const product = new whishlistModel({
                userId: req.session.userId,
                product: findData.product,
                Image: findData.image[0].path,
                Price: findData.price,
                proId: req.query.proId
            });
            await product.save();
            res.redirect('/whishlist');
        }
    } catch (e) {
        console.log(e);
    }
};


const displaywhishlist= async(req,res)=>{
    try{
        const whishList= await whishlistModel.find({userId:req.session.userId})
        console.log(whishList)
        res.render('whishList',{data:whishList})
    }catch(e){

    }
}

const removeWishlist = async(req,res)=>{
    try{
        const remove =await whishlistModel.deleteOne({_id:req.query.wishId})
        res.redirect('/whishlist')
    }catch(e){

    }

}

module.exports = ({
    addTowhishlist,
    displaywhishlist,
    removeWishlist,
})