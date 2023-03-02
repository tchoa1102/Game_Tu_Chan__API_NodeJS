const express = require('express')
const router = express.Router()

const UserController = require('../app/controllers/UserController') 
const ImmortalityController = require('../app/controllers/ImmortalityController')

// [GET]
router.get('/whoami', UserController.get)
// [POST]
router.post('/:id/immortalities/create', ImmortalityController.create)

module.exports = router
