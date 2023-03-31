const express = require('express')
const router = express.Router()

const { UserController, ImmortalityController, } = require('../app/controllers')

// [GET]
router.get('/whoami', UserController.get)
router.get('/:id/immortalities', ImmortalityController.getAll)
// [POST]
router.post('/:id/immortalities/create', ImmortalityController.createTest)
// [PATCH]
router.patch('/:idUser/embattle', UserController.embattle)
router.patch('/:idUser/immortalities/:idImmortality/enlist', ImmortalityController.enlist)
router.patch('/:idUser/immortalities/:idImmortality/training/:skillName/increaseSpeed', ImmortalityController.increaseSpeed)

// [DELETE]
router.delete('/:idUser/immortalities/:idImmortality', ImmortalityController.delete)

module.exports = router
