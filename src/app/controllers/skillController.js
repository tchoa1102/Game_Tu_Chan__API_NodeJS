const Skill = require('../models/Skill')

class SkillController {
    // [POST] /skills/create
    async create(req, res, next) {
        const data = req.body
        // data.floors = null
        console.log("body: ", req.body)

        const skill = new Skill(data)

        try {
            // console.log(skill)
            const result = await skill.save()
        } catch (error) {
            console.log(error)
        }

        return res.json({
            message: 'Created skill!',
        })
    }

    // [PATCH] /skills/update/:id
    async update(req, res, next) {}

    // [PATCH] /skills/update/:id/name
    async updateFloor(req, res, next) {}
}

module.exports = new SkillController
