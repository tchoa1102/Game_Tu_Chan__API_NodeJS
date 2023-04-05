const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { User, Skill, Immortality } = require('../models')

class UserController {
    // [GET] /api/users/whoami
    async get(req, res, next) {
        console.log("\n\n\nGet user...")
        try {
            // console.log("Auth", req.session.passport.user.emails)
            if (req.session.passport?.user) {
                console.log('json')
                const user = await User.findOne({ _id: req.session.passport.user._id })
                    .populate({
                        path: 'bag.items',
                        populate: {
                            path: 'item',
                        }
                    })
                    .populate({
                        path: 'bag.equipments',
                        populate: {
                            path: 'equip'
                        }
                    })
                    .populate({
                        path: 'bag.skills',
                        populate: {
                            path: 'skill'
                        }
                    })

                return res.json(user)
            } else return res.status(400).json({
                message: 'Bạn chưa đăng nhập!'
            })
        } catch (error) {
            next(error)
        }
    }

    // [PATCH] /api/users/:idUser/embattle
    async embattle(req, res, next) {
        try {
            const body = req.body
            const idUser = req.params.idUser
            const idImmortality = body.idImmortality
            const index = body.index
            const user = await User.findById(idUser)
            const immortality = await Immortality.findById(idImmortality)
            const strategy = user.strategy
            // location on strategy is exists
            if ( !! strategy[index] ) {
                if (strategy[index] != immortality._id) {
                    // immortality was embattled
                    if ( !!immortality.index ) {
                        const lastImmortality = await Immortality.findById(strategy[index])
                        // index == lastImmortality.index => true
                        console.log(strategy[index], strategy[immortality.index])
                        strategy[index] = immortality._id
                        strategy[immortality.index] = lastImmortality._id

                        console.log(index, lastImmortality.index, immortality.index)
                        lastImmortality.index = immortality.index
                        immortality.index = index
                        console.log(index, lastImmortality.index, immortality.index)
                        console.log('Swap')

                        await lastImmortality.save()
                    }
                }
            } else {
                console.log('Xuất trận')
                strategy[index] = immortality._id
                immortality.index = index
            }
            await user.save()
            await immortality.save()
            return res.json(immortality)
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/equipments/remove
    async removeEquip(req, res, next) {
        try {
            const idUser = req.params.idUser
            const idEquipment = req.body.idEquipment
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip' })
            const equipments = user.bag.equipments

            for(let equipment of equipments) {
                if (equipment.equip._id.toString() == idEquipment) {
                    equipment.wearIs = '000000000000000000000000'
                    break
                }
            }

            console.log(user.bag.equipments)

            await user.save()
            return res.json({
                message: 'Thành Công',
                data: equipments
            })
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/equipments/equip
    async equip(req, res, next) {
        try {
            const idUser = req.params.idUser
            const idImmortality = req.body.idImmortality
            const idEquipment = req.body.idEquipment
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip' })
            const equipments = user.bag.equipments

            for(let equipment of equipments) {
                if (equipment.equip._id.toString() == idEquipment) {
                    equipment.wearIs = ObjectId(idImmortality)
                    break
                }
            }

            await user.save()

            return res.json({
                message: 'Thành Công',
                data: equipments
            })
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = new UserController
