const category = require('../../model/catergoryModel');

const getCategory = async (req, res) => {
    try {
        console.log(req.query.msg + "7777777777777777777777777777777777777777777777777777")
        let catExist = req.query.msg
        let data = await category.find().sort({ _id: -1 });
        console.log(data)
        res.render('adminCategory', { data: data })
    } catch (e) {
        console.log('error in the getCategory :', e);
        res.redirect('/admin/error');
    }

}


const addCategory = async (req, res) => {
    try {
        console.log(req.body);
        let categoryName = req.body.category.toLowerCase();
        let existingCategory = await category.findOne({ category: req.body.category });
        console.log(existingCategory);
        if (existingCategory) {
            console.log('Category name already exists');
            res.redirect('/admin/Category?msg= category already exit');
        }else{
        console.log(req.body,'else in add')
        let newcat = new category({
            category: req.body.category
        })
        await newcat.save()
        res.redirect('/admin/Category')
        }
    }
    catch(e) {
        console.log('error in the addCatergory', e);
        res.redirect('/admin/error');
    }
}
const changeStatus = async (req, res) => {
    try {
        console.log(req.query.id);
        let categoryData = await category.findOne({ _id: req.query.id });
        if (categoryData.status) {
            await category.updateOne({ _id: req.query.id }, { status: false });
        } else {
            await category.updateOne({ _id: req.query.id }, { status: true });

        }
        res.redirect('/admin/Category');

    } catch (e) {
        console.log('error in the changeStatus : ', e);
        res.redirect('/admin/error');
    }
}
const editCategory = async (req, res) => {
    try {
        console.log(req.body);
        const catData = await category.find({ category: req.body.oldCat })
        

        if(req.body.oldCat.toLowerCase()==req.body.category.toLowerCase())

        console.log(catData)
        if (catData.length > 1) {
            res.redirect('/admin/Category')
        } else {
            await category.updateOne({ category: req.body.oldCat }, { category: req.body.category })
        }
        res.redirect('/admin/Category');

    } catch (e) {
        console.log('error in the editCategory : ', e);
        res.redirect('/admin/error');
    }
}


module.exports = {
    addCategory,
    getCategory,
    changeStatus,
    editCategory
}