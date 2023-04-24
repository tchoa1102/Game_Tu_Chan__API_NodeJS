const express = require('express')
const router = express.Router()

const { UserController, ImmortalityController, QuestController } = require('../app/controllers')

// [GET]
router.get('/whoami', UserController.get)
router.get('/:id/immortalities', ImmortalityController.getAll)
router.get('/:id/quests', QuestController.getAllQuests)
router.get('/:id/fightPlayer/:idPlayer', UserController.fightPlayer)
router.get('/', UserController.getAll)

// [POST]
router.post('/:id/immortalities/create', ImmortalityController.createTest)

// [PATCH]
router.patch('/:idUser/embattle', UserController.embattle)
router.patch('/:idUser/embattleRecover', UserController.embattleRecover)
router.patch('/:idUser/immortalities/:idImmortality/enlist', ImmortalityController.enlist)
router.patch('/:idUser/immortalities/:idImmortality/training/:skillName/increaseSpeed', ImmortalityController.increaseSpeed)
router.patch('/:idUser/equipments/remove', UserController.removeEquip)
router.patch('/:idUser/equipments/equip', UserController.equip)

// [DELETE]
router.delete('/:idUser/immortalities/:idImmortality', ImmortalityController.delete)

module.exports = router
