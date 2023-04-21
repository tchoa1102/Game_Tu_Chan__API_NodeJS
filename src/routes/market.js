const express = require('express')
const router = express.Router()

const { MarketController, } = require('../app/controllers')

router.get('/', MarketController.getAll)

router.post('/', MarketController.create)

module.exports = router
