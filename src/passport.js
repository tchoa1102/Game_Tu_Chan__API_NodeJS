require('../.env')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy

const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const User = require('./app/models/User')
const { mergeObject } = require('./util/Passport')

// serializeUser will receive profile from callback done on GoogleStrategy then it pass parameters in callback,
//      it is called before redirect request from google server to this server and 'code'
//      it will save data user on req.session.passport.user
passport.serializeUser((user, done) => {
    while (user.id.length < 24) {
        user.id += '1'
    }

    User.findOne({ _id: ObjectId(user.id) })
        .then((currentUser) => {
            if (currentUser) {
                console.log(user)
                const u = mergeObject(user, currentUser)
                console.log("\n\nUser: ", u)
                done(null, u)
            } else {
                const data = {
                    _id: ObjectId(user.id),
                    name: user.displayName,
                    email: user.email,
                    avatar: user.picture,
                    birth: '',
                }
                const newUser = new User(data)
                newUser
                    .save()
                    .then((u) => {
                        done(null, mergeObject(user, u))
                    })
                    .catch((err) => done(err))
            }
        })
        .catch((err) => done(err))
})
// deserializeUser will receive param from function done in serializeUser, it is called before redirect request
//      it will save data user on req.user
passport.deserializeUser(function (user, done) {
    done(null, user)
})

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.clientID, // Your Credentials here.
            clientSecret: process.env.clientSecret, // Your Credentials here.
            callbackURL: 'http://localhost:4000/auth/federated/google',
            passReqToCallback: true,
        },
        (request, accessToken, refreshToken, profile, done) => {
            profile.accessToken = accessToken
            profile.refreshToken = refreshToken
            return done(null, profile)
        },
    ),
)
