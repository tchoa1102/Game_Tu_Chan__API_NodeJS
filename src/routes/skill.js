const express = require('express')
const router = express.Router()
const SkillController = require('../app/controllers/SkillController')

router.patch('/update/:id', SkillController.update)
router.post('/create', SkillController.create)

module.exports = router
