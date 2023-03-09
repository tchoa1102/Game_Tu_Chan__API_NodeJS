const express = require('express')
const router = express.Router()

const QuestController = require('../app/controllers/QuestController')

// [POST] /api/quests/:id/clusters
router.post('/:id/clusters', QuestController.createCluster)
// [POST] /api/quests
router.post('/', QuestController.create)

// [PATCH] /api/quests/:idQuest/clusters/:idCluster/immortalities
router.patch('/:idQuest/clusters/:idCluster/immortalities', QuestController.updateClustersImmortality)

module.exports = router
