const productModel = require('../../model/productModel');
const catergoryModel = require('../../model/catergoryModel')

const displayHomeData = async (req, res) => {
    try {
        const productData = await productModel.find({ status: true });
        let login = false
        if (req.session.user) {
            login = true;
        }
        res.render('home', { data: productData, login: login });
    } catch (e) {
        console.log('error in the displayHomeData', e)
    }
}

const productDetail = async (req, res) => {
    try {
        console.log(req.params.id)
        const productData = await productModel.findOne({ _id: req.params.id })
        console.log(productData)
        console.log('++++++++++++++++++++++++')
        let login = false
        if (req.session.user) {
            login = true;
        }
        res.render('product details', { data: productData, login: login })
    } catch (e) {
        console.log('error in the producrDetail ', e)
    }
}

const categoryWiseProduct = async (req, res) => {
    try {
        const catId = req.query.id
        console.log(catId, 'showinggg');
        const { sort } = req.query
        console.log(sort, 'sort is shwoing');
        let sortOption
        if (sort === 'priceLowHigh') {
            sortOption = { price: 1 }
        } else if (sort === 'priceHighLow') {
            sortOption = { price: -1 }
        } else if (sort === 'aToZ') {
            sortOption = { product : 1 };
        } else if (sort === 'zToA') {
            sortOption = { product : -1 };
        }else{
            sortOption = {_id:1}
        }
        console.log(sortOption,'sort option is showing ');
        let data
        if (catId !=='all') {
            console.log('inside the if ');
            data = await productModel.find({ status: true ,category:catId}).sort(sortOption)
        } else {
            data = await productModel.find({ status: true }).sort(sortOption)
        }
        console.log(data, '+++++++++++++++++++++++++++++++++++++')
        const catData = await catergoryModel.find({ status: true });
        // console.log(catData)
        let login = false
        if (req.session.user) {
            login = true;
        }
        res.render('category', { data: data, catData: catData, login: login, sort });
    } catch (e) {
        console.log('error in the categoryWiseProduct', e);
    }
}

const serachProduct = async (req, res) => {
    try {
        console.log(req.body)
        let login = false
        if (req.session.user) {
            login = true;
        }
        const catData = await catergoryModel.find({ status: true });

        const datas = req.body.search;
        const regex = new RegExp(`${datas}`, 'i')
        const data = await productModel.find({ product: regex });
        console.log(data, './././././.')
        res.render('searchProducts', { data: data, catData: catData, login: login })
    } catch (e) {
        console.log('error in the serachProduct :', e);
    }
}




module.exports = {
    displayHomeData,
    productDetail,
    categoryWiseProduct,
    serachProduct,
}