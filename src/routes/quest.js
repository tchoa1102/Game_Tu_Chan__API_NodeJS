const express = require('express')
const router = express.Router()

const QuestController = require('../app/controllers/QuestController')

// [GET] /api/quests/:id
router.get('/:id', QuestController.getQuest)
// [GET] /api/quests
router.get('/', QuestController.get)

// [POST] /api/quests/:id/clusters
router.post('/:id/clusters', QuestController.createCluster)
// [POST] /api/quests
router.post('/', QuestController.create)

// [PATCH] /api/quests/:idQuest/clusters/:idCluster/immortalities
router.patch('/:idQuest/clusters/:idCluster/immortalities', QuestController.updateClustersImmortality)

module.exports = router