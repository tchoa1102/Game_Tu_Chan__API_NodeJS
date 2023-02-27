const express = require('express')
const router = express.Router()
const ImmortalityController = require('../app/controllers/ImmortalityController.js')

router.post('/:id/immortalities/create', ImmortalityController.create)

module.exports = router
