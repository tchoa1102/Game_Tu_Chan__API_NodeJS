const express = require('express')
const router = express.Router()
const SkillController = require('../app/controllers/skillController')

router.get('/', SkillController.create)

module.exports = router
