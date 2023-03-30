const express = require('express')
const router = express.Router()

const { UserController, ImmortalityController, } = require('../app/controllers')

// [GET]
router.get('/whoami', UserController.get)
router.get('/:id/immortalities', ImmortalityController.getAll)
// [POST]
router.post('/:id/immortalities/create', ImmortalityController.create)
// [PATCH]
router.patch('/:idUser/immortalities/:idImmortality/training/:skillName/increaseSpeed', ImmortalityController.increaseSpeed)

module.exports = router
