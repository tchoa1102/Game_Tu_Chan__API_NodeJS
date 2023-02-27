const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const User = require('../models/User')

class AuthController {
    // [GET] /api/auth/federated/google/success
    oAuthSuccess(req, res, next) {
        if (!req.user) res.redirect('/auth/federated/google/failure')
        res.redirect('http://localhost:3000')
    }

    // [GET] /api/auth/federated/google/failure
    oAuthFailure(req, res, next) {
        res.send('err')
    }

    // [GET] /api/auth/logout
    logout(req, res, next) {
        req.logout((err) => {
            if (err) return next(err)
        })
        // res.redirect('back')
        return res.json()
    }

    // [GET] /api/auth/user
    async show(req, res, next) {
        console.log("\n\n\nGet user...")
        try {
            // console.log("Auth", req.session.passport.user.emails)
            if (req.session.passport?.user) {
                console.log('json')
                let user = await User.findOne({ _id: req.session.passport.user._id })

                user = mergeObject(req.session.passport.user, user)

                return res.json(user)
            } else return res.json()
        } catch (err) {
            console.log(err)
            return res.status(500).json()
        }
    }
}

module.exports = new AuthController()
