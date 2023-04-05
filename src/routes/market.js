const express = require('express')
const router = express.Router()

const { MarketController, } = require('../app/controllers')

router.post('/', MarketController.create)

module.exports = router
