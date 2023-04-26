const express = require('express')
const router = express.Router()

const { MarketController, } = require('../app/controllers')

// [GET]
router.get('/', MarketController.getAll)

// [POST]
router.post('/', MarketController.create)

// [PATCH]
router.patch('/buy', MarketController.buy)

module.exports = router
