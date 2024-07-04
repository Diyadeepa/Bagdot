const categoryModel = require('../../model/catergoryModel');
const productModel = require('../../model/productModel');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const getProduct = async (req, res) => {
    try {
        let prev = 0;
        let next = 1;
        let skip = 0;
        let msg = "" || req.query.msg
        const productDataCount = await productModel.countDocuments({});
        const productData = await productModel.find({})
            .sort({ _id: -1 })
            .limit(5);
        let catergory = await categoryModel.find({});
        // console.log(productData[0].image)
        res.render('adminProduct', { data: productData, prev: prev, next: next, count: productDataCount, skip: skip, CatData: catergory, msg: msg });

    } catch (e) {
        console.log('error in the getProduct', e);
        res.redirect('/admin/error');
    }
}

const productPagenation = async (req, res) => {
    try {
        let num = 1; // Default page number
        let prev = 0;
        let next = 0;
        if (req.query.page) {
            num = parseInt(req.query.page);
            prev = num - 1;
            next = num + 1;
            if (num < 1) {
                num = 1;
            }
        }
        const limit = 5;
        const skip = Math.max(0, (num - 1) * limit); // Ensure skip value is not negative
        const productDataCount = await productModel.countDocuments({});
        const productData = await productModel.find({})
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        let msg = ""
        let catergory = await categoryModel.find({});
        res.render('adminProduct', { data: productData, prev: prev, next: next, count: productDataCount, skip: skip, msg: msg, CatData: catergory });

    } catch (e) {
        console.log('error in the productPagenation : ', e);
        res.redirect('/admin/error');
    }
}

const productAddPage = async (req, res) => {
    try {
        let catergory = await categoryModel.find({});
        res.render('adminProduct-add', { data: catergory });
    } catch (e) {
        console.log('error in the productAddPage', e);
        res.redirect('/admin/error');
    }
}

const addProduct = async (req, res) => {
    try {
        console.log('add product post reache ---------->> ');
        const files = req.files;
        const uploadedImages = [];
        console.log(files, 'files ------------------------------------files');
        console.log(req.body, 'req.body ------------------------------- req.body');

        for (const file of files) {
            const resizedImageBuffer = await sharp(file.path)
                .resize({ width: 500, height: 500 })
                .toBuffer();

            const fileName = Date.now() + '-' + file.originalname;
            const filePath = path.join('./public/uploads/', fileName);
            fs.writeFileSync(filePath, resizedImageBuffer);
            let newPath = filePath.replace(/\\/g, '/').replace(/public/, '');
            uploadedImages.push({
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: newPath
            });
        }

        console.log(req.body)
        const { productName, category, description, about, price, stock } = req.body;
        const newProduct = new productModel({
            product: productName,
            price: price,
            description: description,
            category: category,
            stock: stock,
            image: uploadedImages,
            about: about
        })

        await newProduct.save();
        res.redirect('/admin/Product');
    } catch (e) {
        console.log('error in the addProduct ', e);
        res.redirect('/admin/error');
    }
}


const editProduct = async (req, res) => {
    try {
        const proId = req.params.id;
        const product = await productModel.findById(proId);
        console.log(product, '++++++++++++++++++')
        const exImage = product.image || []; // Ensure exImage is an array even if it's null
        const files = req.files || []; // Ensure files is an array even if it's null
        let updImages = [];
        let newImages = []

        if (files.length > 0) { // Check if files were uploaded
            for (const file of files) {
                const resizedImageBuffer = await sharp(file.path)
                    .resize({ width: 500, height: 500 })
                    .toBuffer();

                const fileName = Date.now() + '-' + file.originalname;
                const filePath = path.join('./public/uploads/', fileName);
                fs.writeFileSync(filePath, resizedImageBuffer);
                let newPath = filePath.replace(/\\/g, '/').replace(/public/, '');
                newImages.push({
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    path: newPath
                });
            }
            updImages = [...exImage, ...newImages];
        } else {
            updImages = exImage;
        }

        const { productName, price, description, about, category, stock } = req.body;
        // Update the product
        // console.log(name,'--------------------------------------------------------------------------')
        const updatedProduct = await productModel.findByIdAndUpdate(
            proId,
            {
                product: productName,
                price: price,
                description: description,
                category: category,
                stock: stock,
                about: about,
                is_blocked: false,
                image: updImages,
            },
            { new: true } // Return the updated document
        );


        if (!updatedProduct) {
            return res.redirect('/admin/error');
        }

        res.redirect('/admin/Product?msg=Product Edited successful');
    } catch (e) {
        console.log('error in the editProduct :', e);
        res.redirect('/admin/error');
    }
}

const changeStatus = async (req, res) => {
    try {
        console.log(req.query.id)
        const data = await productModel.findOne({ _id: req.query.id });
        if (data.status) {
            await productModel.updateOne({ _id: req.query.id }, { status: false });
        } else {
            await productModel.updateOne({ _id: req.query.id }, { status: true });
        }
        res.redirect('/admin/Product');
    } catch (e) {
        console.log('error in the changeStatus', e);
        res.redirect('/admin/error');
    }
}

const deleteImage = async (req, res) => {
    try {
        console.log('req.query.pos', req.query.image);
        console.log(req.query.id)

        const deleteImage = await productModel.updateOne(
            { _id: req.query.id },
            { $pull: { image: { path: req.query.image } } }
        );

        console.log(deleteImage)
        res.redirect('/admin/Product')

    } catch (e) {
        console.log('error in the delteImage : ', e);
    }

}



module.exports = {
    getProduct,
    productAddPage,
    addProduct,
    editProduct,
    changeStatus,
    productPagenation,
    deleteImage,
}