const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { Immortality, User, Avatar, Skill, Setup } = require('../models')

class ImmortalityController {
    // [GET] /api/users/:id/immortalities
    async getAll(req, res, next) {
        const id = req.params.id

        try {
            const result = await Immortality.find({user: id}).lean()
            for(let e of result) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key}).populate({ path: 'floors.costs.item' })
                    e.skills[key].description = skill.description
                    e.skills[key].image = skill.image
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }

            // console.log(result)
            return res.json(result)
        } catch (error) {
            return next(error)
        }
    }

    // [POST] /api/immortalities/save
    async create(req, res, next) {
        try {
            const body = req.body
            const newImmortality = {
                name: '',
                currentStatus: {},
                status: {},
            }

            const { immortalitiesName, } = await Setup.findOne({}).lean()
            const index = getRandom(immortalitiesName.length)
            newImmortality.status.HP = getRandom(500) + 1000
            newImmortality.status.MP = getRandom(500) + 1000
            newImmortality.status.ATK = getRandom(50) + 50
            newImmortality.status.INT = getRandom(50) + 50
            newImmortality.status.DEF = getRandom(50) + 50
            newImmortality.status.ACC = getRandom(50) + 50
            newImmortality.status.AGI = getRandom(50) + 50
            newImmortality.name = immortalitiesName[index]
            newImmortality.currentStatus = new Object(newImmortality.status)

            const immortality = new Immortality(newImmortality)
            await immortality.save()

            return res.json(immortality)
            function getRandom(max) {
                return Math.floor(Math.random() * max)
            }
        } catch (error) {
            return next(error)
        }
    }

    // [POST] /api/users/:id/immortalities/create
    async createTest(req, res, next) {
        const data = req.body

        try {
            const immortality = new Immortality(data)
            const result = await immortality.save()

            return res.json(result)
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/immortalities/:idImmortality/enlist
    async enlist(req, res, next) {
        try {
            const idUser = req.params.idUser
            const idImmortality = req.params.idImmortality
            const immortality = await Immortality.findById(idImmortality)
            immortality.user = new ObjectId(idUser)
            await immortality.save()

            return res.json({ message: 'Thành Công' })
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/immortalities/:idImmortality/training/:skillName
    async training(req, res, next) {
        try {
            const idUser = req.params.idUser
            const idImmortality = req.params.idImmortality
            const skillName = req.params.skillName.replace(/-/g, ' ')
            
            const immortality = await Immortality.findById(idImmortality)
            immortality.trainingSkill = skillName
            await immortality.save()
            return res.json({ message: 'Thành Công' })
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/immortalities/:idImmortality/training/:skillName/increaseSpeed
    async increaseSpeed(req, res, next) {
        try {
            const idUser = req.params.idUser
            const idImmortality = req.params.idImmortality
            const skillName = req.params.skillName.replace(/-/g, ' ')
            const timeSpeed = 60 // 60 seconds

            const user = await User.findById(idUser).populate({ path: 'bag.items.item' })
            const items = user.bag.items
            const immortality = await Immortality.findById(idImmortality)
            const skillIsIncreasedSpeed = immortality.skills[immortality.trainingSkill]
            const skill = await Skill.findOne({name: immortality.trainingSkill}).populate({ path: 'floors.costs.item' })

            if (skill) {
                for(let i = 0; i < skill.floors.length; i++) {
                    const floor = skill.floors[i]
                    if (floor.name == skillIsIncreasedSpeed.floor) {
                        if (floor.trainedTime > skillIsIncreasedSpeed.exp) {
                            const isExistAndEnough = floor.costs.every((cost) => items.some(item => {
                                // exist and enough
                                return cost.item._id.toString() == item.item._id.toString() && cost.quantity <= item.quantity
                            }))
                            console.log(isExistAndEnough)
                            if (isExistAndEnough) {
                                floor.costs.every((cost) => items.some(item => {
                                    if (cost.item._id.toString() == item.item._id.toString()) {
                                        console.log('------------')
                                        item.quantity -= cost.quantity
                                    }
                                    return 1
                                }))
                            }
                            console.log('Save')
                            await user.save()
                            skillIsIncreasedSpeed.exp -= -timeSpeed
                            if (skillIsIncreasedSpeed.exp > floor.trainedTime) {
                                skillIsIncreasedSpeed.exp = floor.trainedTime
                                immortality.trainingSkill = ''
                            }
                            await Immortality.updateOne({ _id: immortality._id }, {
                                skills: immortality.skills,
                                trainingSkill: immortality.trainingSkill
                            })
                        }
                    }
                }
            }

            return res.json({ message: 'Thành Công' })
        } catch (error) {
            return next(error)
        }
    }
    
}

module.exports = new ImmortalityController
