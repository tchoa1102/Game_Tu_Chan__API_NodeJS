const express = require('express')
const router = express.Router()
const passport = require('passport')

const authController = require('../app/controllers/AuthController')

// [GET]
// login, send google server
router.get(
    '/login',
    passport.authenticate('google', {
        scope: ['email', 'profile'],
        accessType: 'offline',
        prompt: 'consent',
    }),
)
// get feedback from google server
router.get(
    '/federated/google',
    passport.authenticate('google', {
        successRedirect: '/auth/federated/google/success',
        failureRedirect: '/auth/federated/google/failure',
    }),
)
router.get('/federated/google/success', authController.oAuthSuccess)
router.get('/federated/google/failure', authController.oAuthFailure)
router.get('/logout', authController.logout)

module.exports = router
