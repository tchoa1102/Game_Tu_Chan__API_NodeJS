const { Skill, } = require('../models')

class SkillController {
    // [GET] /api/skills
    async get(req, res, next) {
        try {
            const result = await Skill.find({})
                .populate({ path: 'floors.activities.effects.mainEffect' })
                .populate({ path: 'floors.costs.item' })
            const skills = result.reduce((total, skill) => {
                total[skill.name] = skill
                return total
            }, {})

            return res.json(skills)
        } catch (error) {
            next(error)
        }
    }

    // [POST] /api/skills/create
    async create(req, res, next) {
        const data = req.body
        // data.floors = null
        console.log("body: ", req.body)

        const skill = new Skill(data)

        try {
            // console.log(skill)
            const result = await skill.save()
        } catch (error) {
            next(error)
        }

        return res.json({
            message: 'Created skill!',
        })
    }

    // [PATCH] /api/skills/update/:id
    async update(req, res, next) {}

    // [PATCH] /api/skills/update/:id/name
    async updateFloor(req, res, next) {}
}

module.exports = new SkillController
