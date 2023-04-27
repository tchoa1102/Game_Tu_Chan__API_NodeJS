const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { User, Skill, Immortality, Setup, Fight, Avatar } = require('../models')

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

    // [GET] /api/users
    async getAll(req, res, next) {
        try {
            const { levels, } = await Setup.findOne().lean()
            const listUser = await User.find({}).lean()

            for(let user of listUser) {
                const immortalities = await Immortality.find({ user: user._id })
                user.immortalities = immortalities

                const largestImmortality = immortalities.reduce((largest, e) => {
                    // find largest level
                    largest = new Object(findLargestLevel(levels, largest, e))

                    return largest
                }, new Object(immortalities[0]))

                user.maxLevel = largestImmortality.level ? {...largestImmortality.level} 
                                    : {name: 'Luyện Khí Kì', level: 'Tầng 1'}
            }

            return res.json(listUser)
        } catch (error) {
            return next(error)
        }

        function findLargestLevel(levels, largest, source) {
            const largestLevel = largest.level
            const levelCurrent = source.level

            if (
                levels[largestLevel.name].index < levels[levelCurrent.name].index
            ) {
                largest = {...source}
            } else if (
                levels[largestLevel.name].index == levels[levelCurrent.name].index
            ) {
                if (levels[largestLevel.name][largestLevel.level].index < levels[levelCurrent.name][levelCurrent.level].index) {
                    largest = {...source}
                }
            }
    
            return largest
        }
    }

    // [GET] /api/users/:id/fightPlayer/:idPlayer
    async fightPlayer(req, res, next) {
        try {
            // const idUser = req.params.id
            const idPlayer = req.params.idPlayer

            // const idUser = '117658907214625686230111' || req.session.passport.user._id
            const idUser = req.session.passport.user._id

            const { whos, players, levels, typeOfActivity, typeOfTarget, locationSkill } = await Setup.findOne().lean()
            // console.log(levels, typeOfActivity, typeOfTarget)

            // user
            let totalData = 0
            const avatars = {}
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip', })
            const equipmentsOfUser = user.bag.equipments
            const immortalitiesUser = await Immortality.find({user: idUser})
            totalData += await collectAvatars(avatars, immortalitiesUser)
            // mounted skills
            await mountedSkill(immortalitiesUser)
            // increase
            increase(levels, immortalitiesUser, equipmentsOfUser)
            
            // Player
            const player = await User.findById(idPlayer).populate({ path: 'bag.equipments.equip', })
            const equipmentsOfPlayer = player.bag.equipments
            const immortalitiesPlayer = await Immortality.find({user: idPlayer})
            totalData += await collectAvatars(avatars, immortalitiesPlayer)
            // mounted skills
            await mountedSkill(immortalitiesPlayer)
            // increase
            increase(levels, immortalitiesPlayer, equipmentsOfPlayer)

            // fight
            const mountLeftField = {}
            const mountRightField = {}
            mountedField(mountLeftField, immortalitiesUser)
            mountedField(mountRightField, immortalitiesPlayer)
            // const queue = new queueMicrotask // ??

            let skillsList = {}
            let statesList = []
            const stateFight = {
                win: 'Thắng Lợi',
                defense: 'Thất Bại',
                draw: 'Hòa'
            }

            // action
            const result = new Fight(whos, players, mountLeftField, mountRightField, typeOfActivity, typeOfTarget, stateFight)
                                .run()

            const plot = [...result.plot]
            skillsList = new Object(result.skillsList)
            statesList = [...result.statesList]

            const resultFight = result.resultFight
            if (resultFight == stateFight.win) {
                // computed awards
                if (Array.isArray(player.bag.items)) {
                    let numberOfStone = player.bag.items.find(i => i.item.toString() == '64002ada2f93ddad6483a848')
    
                    if (numberOfStone) {
                        const stoneReceived = Math.floor(numberOfStone.quantity * 0.1)
                        numberOfStone.quantity = numberOfStone.quantity - stoneReceived

                        await player.save()

                        user.bag.items.forEach(i => {
                            if (i.item.toString() == '64002ada2f93ddad6483a848') {
                                i.quantity += stoneReceived
                            }
                        })

                        await user.save()
                    }
                }
            }

            // Covert stateList
            const states = statesList.reduce((result, state) => {
                const newState = {
                    name: state.name,
                    image: state.image,
                    effect: state.action,
                    style: state.style,
                    animation: state.animation,
                    amount: 1,
                }

                if (result[state.name] && result[state.name].amount < Object.keys(immortalitiesUser).length + Object.keys(immortalitiesPlayer).length) {
                    result[state.name].amount += 1
                    totalData += 1
                } else if (!result[state.name]) {
                    totalData += 1
                    result[state.name] = newState
                }
                return result
            }, {})

            const status = {}
            status.you = collectImmortality(immortalitiesUser, players.you)
            status.defense = collectImmortality(immortalitiesPlayer, players.defense)
            const { newSkills, totalData: td } = collectSkills(skillsList)
            // console.log(newSkills)
            totalData += td

            // console.log('\n\n\nresult: ')
            // console.log('Avatars: ', avatars) //done
            // console.log('SkillsList: ', skills) //done
            // console.log(skillsList['Hỏa Cầu'].floor.mainEffect)
            // console.log('StatesList: ', statesList) //done
            // console.log('Status: ', status) //done
            // console.log('mountLeftField: ', mountLeftField)
            // console.log('mountRightField: ', mountRightField)
            // console.log('Immortality User: ', immortalitiesUser)
            // console.log('Immortality Cluster: ', immortalitiesPlayer)
            // console.log(plot, plot.length)
            // plot.forEach((round) => {
            //     console.log(round)
            // })
            // plot.forEach((round, index) => console.log(index, round.you.effects, round.defense.effects, '\n'))
            console.log('\n\nThe End!')
            return res.json({
                avatars,
                skills: newSkills,
                states,
                status,
                plot,
                resultFight,
                totalData,
                locationSkill,
                defense: player.name,
            })
        } catch (error) {
            return next(error)
        }

        function isLargerOrEqual(levels, target, nameLevel, step) {
            if (levels[target.name].index > levels[nameLevel].index) {
                return true
            } else if (
                levels[target.name].index == levels[nameLevel].index &&
                levels[target.name][target.level].index >= levels[nameLevel][step].index 
            ) {
                return true
            }

            return false
        }

        function findIndicatorIncrement(levels, immortality) {
            let indicator = 1
            Object.keys(levels).forEach( nameLevel => {
                Object.keys(levels[nameLevel]).forEach( step => {
                    if (isLargerOrEqual(levels, immortality.level, nameLevel, step)) {
                        const eraseX = levels[nameLevel][step].increase.substr(1)
                        const increase = Number.parseFloat(eraseX)
                        indicator *= increase
                    }
                })
            })

            return indicator
        }

        async function collectAvatars(avatars, immortalities) {
            let totalData = 0
            for(const immortality of immortalities) {
                const newAvatar = await Avatar.findOne({ name: immortality.avatar })
                if (newAvatar) {
                    avatars[newAvatar.name] = newAvatar.effects
                    totalData += Object.keys(newAvatar.effects).length
                }
            }
            return totalData
        }

        function collectImmortality(immortalities, who) {
            const newImmortalities = {}
            immortalities.forEach(immortality => {
                const newImmortality = {
                    index: immortality.index * who,
                    name: immortality.name,
                    avatar: immortality.avatar,
                    hp: immortality.status.HP,
                    mp: immortality.status.MP,
                    currentHP: immortality.currentStatus.HP,
                    currentMP: immortality.currentStatus.MP,
                    status: immortality.status,
                }
                newImmortalities[immortality.index] = newImmortality
            })

            return newImmortalities
        }

        function collectSkills(skills) {
            let totalData = 0
            const newSkills = Object.keys(skills).reduce((result, key) => {
                skills[key]?.floor.activities.forEach(activity => {
                    if (!result[activity.effects.mainEffect.name]) {
                        const newSkill = {
                            name: activity.effects.mainEffect.name,
                            amount: 5,
                            style: activity.effects.mainEffect.style,
                            animation: activity.effects.mainEffect.animation,
                            startIs: activity.effects.mainEffect.startIs,
                            location: activity.effects.mainEffect.location,
                            effects: {
                                sky: activity.effects.sky,
                                figure: activity.effects.figure,
                                action: activity.effects.mainEffect.action,
                            },
                            delay: activity.effects.delay,
                        }
                        result[activity.effects.mainEffect.name] = newSkill
                        totalData += result[activity.effects.mainEffect.name].amount
                    }
                })
                return result
            }, {})

            return { newSkills, totalData }
        }

        function increase(levels, immortalities, equipments) {
            immortalities.forEach( currentImmortality => {
                // increase from level
                increaseStatusFromLevel(levels, currentImmortality)
                // increase from equipment
                increaseFromEquipment(equipments, immortalities)
                // increase from skill

            })
        }

        function increaseStatusFromLevel(levels, immortality) {
            const increase = findIndicatorIncrement(levels, immortality)
            Object.keys(immortality.status).forEach( property => {
                immortality.status[property] *= increase
            })
            Object.keys(immortality.currentStatus).forEach( property => {
                immortality.currentStatus[property] *= increase
            })
        }

        function increaseFromEquipment(equipments, immortalities) {
            equipments.forEach( equip => {
                immortalities.forEach( immortality => {
                    if (immortality._id.toString() == equip.wearIs.toString()) {
                        // console.log(equip)
                        const increase = equip.equip.property.value
                        immortality.status[equip.equip.property.type] += increase
                        // immortality.status[equip.equip.property.type] += increase
                        if (equip.equip.property.type == 'HP') {
                            immortality.currentStatus.HP += increase
                        }
                        if (equip.equip.property.type == 'MP') {
                            immortality.currentStatus.MP += increase
                        }
                    }
                })
            })
        }

        function mountedField(field, immortalities) {
            immortalities.forEach(immortality => {
                field[immortality.index] = {
                    isActor: false,
                    index: immortality.index,
                    currentStatus: {...immortality.status},
                    status: {...immortality.status},
                    skills: {...immortality.skills},
                    operateEveryRoundStates: {}, // (key: value)
                    toKeepStatesAlive: {}, // (key: value)
                    /**
                     * key: {
                     *  name: ,
                     *  property: {}
                     *  timeline: , // each round will be subtract, == 0 => delete
                     *  effect: {}
                     * }
                     */
                }

                field[immortality.index].currentStatus.HP = immortality.currentStatus.HP
                field[immortality.index].currentStatus.MP = immortality.currentStatus.MP
            })
        }

        async function mountedSkill(immortalities) {
            for(let e of immortalities) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key}).populate({ path: 'floors.activities.operateEveryRoundStates.effect' })
                                                                .populate({ path: 'floors.activities.toKeepStatesAlive.effect' })
                                                                .populate({ path: 'floors.activities.effects.mainEffect' })
                                                                // .populate({ path: 'floors.mainEffect.effect' })
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }
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

            // This immortality was embattled
            if (immortality.index != -1 || ! immortality.hasOwnProperty('index')) {
                // location on strategy is exists
                if ( !! strategy[index] ) {
                    // This location deference with immortality's location
                    if (strategy[index] != immortality._id) {
                        const lastImmortality = await Immortality.findById(strategy[index])
                        // index == lastImmortality.index => true
                        console.log(strategy[index], strategy[immortality.index])
                        strategy[index] = immortality._id
                        strategy[immortality.index] = lastImmortality._id

                        console.log(index, lastImmortality.index, immortality.index)
                        lastImmortality.index = immortality.index
                        immortality.index = index
                        console.log(index, lastImmortality.index, immortality.index)
                        console.log('Hoán Đổi Vị Trí')

                        await lastImmortality.save()
                    }
                } else {
                    console.log('Đổi Vị Trí')
                    strategy[immortality.index] = ''
                    strategy[index] = immortality._id
                    immortality.index = index
                }
            } else {
                // location on strategy is exists
                if ( !! strategy[index] ) {
                    const lastImmortality = await Immortality.findById(strategy[index])
                    if (lastImmortality) {
                        lastImmortality.index = -1
                        await lastImmortality.save()
                    }
                    immortality.index = index
                    strategy[index] = immortality._id
                } else {
                    const countImmortalityOnBattle = Object.keys(strategy).reduce((total, local) => {
                        if ( !! strategy[local] ) {
                            total += 1
                        }
                    }, 0)
                    if (countImmortalityOnBattle < 4) {
                        console.log('Xuất trận')
                        strategy[index] = immortality._id
                        immortality.index = index
                    } else {
                        return res.json({ message: 'Đầy' })
                    }
                }
            }
            await user.save()
            await immortality.save()
            return res.json(immortality)
        } catch (error) {
            return next(error)
        }
    }

    // [PATCH] /api/users/:idUser/embattleRecover
    async embattleRecover(req, res, next) {
        try {
            const body = req.body
            const idUser = req.params.idUser
            const idImmortality = body.idImmortality
            const user = await User.findById(idUser)
            const immortality = await Immortality.findById(idImmortality)
            const strategy = user.strategy

            immortality.index = -1
            Object.keys(strategy).forEach(key => {
                if (strategy[key] == immortality._id) {
                    strategy[key] = ''  
                }
            })
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
