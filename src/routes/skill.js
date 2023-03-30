const express = require('express')
const router = express.Router()
const { SkillController, } = require('../app/controllers')

router.get('/', SkillController.get)
router.patch('/update/:id', SkillController.update)
router.post('/create', SkillController.create)

module.exports = router
