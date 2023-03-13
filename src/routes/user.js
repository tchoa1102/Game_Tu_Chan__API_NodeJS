const express = require('express')
const router = express.Router()

const { UserController, ImmortalityController, } = require('../app/controllers')

// [GET]
router.get('/whoami', UserController.get)
router.get('/:id/immortalities', ImmortalityController.getImmortalities)
// [POST]
router.post('/:id/immortalities/create', ImmortalityController.create)

module.exports = router
