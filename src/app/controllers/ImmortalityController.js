const Immortality = require('../models/Immortality')
const { Avatar, Skill, } = require('../models')

class ImmortalityController {
    // [GET] /api/users/:id/immortalities
    async getImmortalities(req, res, next) {
        const id = req.params.id

        try {
            const result = await Immortality.find({user: id}).lean()
            for(let e of result) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key})
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }

            // console.log(result)
            return res.json(result)
        } catch (error) {
            next(error)
        }
    }

    // [POST] /api/users/:id/immortalities/create
    async create(req, res, next) {
        const data = req.body

        try {
            const immortality = new Immortality(data)
            const result = await immortality.save()

            return res.json(result)
        } catch (error) {
            next(error)
        }
    }

    
}

module.exports = new ImmortalityController
