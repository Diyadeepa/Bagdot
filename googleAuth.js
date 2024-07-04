const passport = require('passport');
const userModel = require('./server/model/useModel');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const dotenv = require('dotenv')
dotenv.config()

const GOOGLE_CLIENT_ID ="127091567383-hkbgr0oebjr854tvib0e067i5ni5513v.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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"



passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3001/auth/google/callback",
  passReqToCallback: true
},
async function (request, accessToken, refreshToken, profile, done) {
    try {


console.log(profile._json.email,'--------------------------------------------------------profile._json.email')
console.log(profile._json.name)


        let user = await userModel.findOneAndUpdate(
            { Email: profile._json.email },
            {
                $set: {
                    Username:profile._json.name,
                }
            },
            { upsert: true, new: true }
        );
        console.log(user)
        return done(null, user);
    } catch (error) {
        console.log('Error in GoogleStrategy callback:', error);
        return done(error);
    }
}));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});
