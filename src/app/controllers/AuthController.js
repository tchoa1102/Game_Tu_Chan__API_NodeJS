const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { User, } = require('../models')

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
}

module.exports = new AuthController()
