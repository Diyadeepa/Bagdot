const express = require('express')
const bodyParser = require('body-parser');
const session = require('express-session');
const nocache = require("nocache");
const path = require('path')
require('dotenv').config()
const passport = require('passport')
// require("dotenv").config();
const app = express()

const adminRouter = require('./server/routes/admin.js/admin');
const userRouter = require('./server/routes/user.js/user');
// const passport = require('passport');

app.use(passport.initialize())

app.use(session({
  secret: "key123@321yek",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60
  }
}))

app.use(nocache());

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))



app.set('views', [
  path.join(__dirname, 'views/user'),
  path.join(__dirname, 'views/admin')
]);

app.use('/admin', adminRouter);
app.use('/', userRouter);
app.get("*",async(req,res)=>{
  res.render('errorPageUser')
})
app.listen(3001, () => console.log('server 3001 '))