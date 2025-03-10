const multer = require('multer')
const path = require('path')
const fs=require('fs')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/avif': 'avif',
    'image/webp' : 'webp'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null
        }
        cb(uploadError, path.join(__dirname, '../../public/uploads/'))
    },
    filename: function (req, file, cb) {
        const fileName = Date.now() + '_' + file.originalname;
        // const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, fileName)
    }
})

const store = multer({ storage: storage });

module.exports = store;