const express = require('express')
const router = express.Router()

const { ImmortalityController, } = require('../app/controllers')

// [POST]
router.post('/save', ImmortalityController.create)

module.exports = router
