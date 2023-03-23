const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { Quest, Immortality, Setup, User, Skill, Avatar, Fight } = require('../models')

class QuestController {
    // [GET] /api/quests
    async get(req, res, next) {
        try {
            const quest = await Quest.find({}, '_id name front')

            return res.json(quest)
        } catch (error) {
            return next(error)
        }
    }

    // [GET] /api/quests/:id
    async getQuest(req, res, next) {
        const id = req.params.id

        try {
            const { levels } = await Setup.findOne().lean()

            const result = await Quest.findById(id).populate({
                path: 'clusters.immortalities',
            }).populate({
                path: 'clusters.awards.items',
                populate: { path: 'item', },
            }).populate({
                path: 'clusters.awards.skills',
                populate: { path: 'skill', },
            }).populate({
                path: 'clusters.awards.equipments',
                populate: { path: 'equipment', },
            }).lean()

            result.clusters.forEach(cluster => {
                const largestImmortality = cluster.immortalities.reduce((largest, e) => {
                    // find largest level
                    largest = {...findLargestLevel(levels, largest, e)}

                    return largest
                }, new Object(cluster.immortalities[0]))

                cluster.maxLevel = largestImmortality.level ? {...largestImmortality.level} 
                                    : {name: 'Luyện Khí Kì', level: 'Tầng 1'}
            })

            return res.json(result)
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

    // [GET] /api/quests/:idQuest/clusters/:idCluster/fight
    async fight(req, res, next) {
        const idQuest = req.params.idQuest
        const idCluster = req.params.idCluster

        try {
            const idUser = '117658907214625686230111' || req.session.passport.user._id

            const { whos, players, levels, typeOfActivity, typeOfTarget } = await Setup.findOne().lean()
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
            
            // cluster
            const quest = await Quest.findById(idQuest).populate({ path: 'clusters.immortalities' })
            const cluster = quest.clusters.find( cluster => idCluster == cluster._id.toString() )
            const immortalitiesCluster = cluster.immortalities
            totalData += await collectAvatars(avatars, immortalitiesCluster)
            // mounted skills
            await mountedSkill(immortalitiesCluster)
            // increase
            increase(levels, immortalitiesCluster, equipmentsOfUser)

            // fight
            const mountLeftField = {}
            const mountRightField = {}
            mountedField(mountLeftField, immortalitiesUser)
            mountedField(mountRightField, immortalitiesCluster)

            // pointer to mountLeftField and mountRightField
            // const immortalitiesLeft = Object.keys(mountLeftField).map(key => mountLeftField[key])
            // const immortalitiesRight = [...immortalitiesCluster]
            // immortalitiesLeft.sort((a, b) => a.index - b.index)
            // immortalitiesRight.sort((a, b) => a.index - b.index)

            // const queue = new queueMicrotask // ??

            let skillsList = {}
            let statesList = []

            // action
            const result = new Fight(whos, players, mountLeftField, mountRightField, typeOfActivity, typeOfTarget)
                                .run()

            const plot = [...result.plot]
            skillsList = new Object(result.skillsList)
            statesList = [...result.statesList]
            // immortalitiesUser
            // immortalitiesCluster
            statesList = statesList.reduce((result, state) => {
                const newState = {
                    name: state.name,
                    image: state.image,
                    effect: state.action,
                    style: state.style,
                    animation: state.animation,
                    amount: 1,
                }

                if (result[state.name] && result[state.name].amount < Object.keys(immortalitiesUser).length + Object.keys(immortalitiesCluster).length) {
                    result[state.name].amount += 1
                    totalData += 1
                } else if (!result[state.name]) {
                    totalData += 1
                    result[state.name] = newState
                }
                return result
            }, {})

            const leftImmortalities = collectImmortality(immortalitiesUser, players.you)
            const rightImmortalities = collectImmortality(immortalitiesUser, players.defense)
            const status = {
                you: leftImmortalities,
                defense: rightImmortalities,
            }
            const { newSkills, totalData: td } = collectSkills(skillsList)
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
            // console.log('Immortality Cluster: ', immortalitiesCluster)
            // console.log(plot, plot.length)
            // plot.forEach((round) => {
            //     console.log(round)
            // })
            plot.forEach((round, index) => console.log(index, round.you.effects, round.defense.effects, '\n'))
            console.log('\n\nThe End!')
            return res.json({
                avatars,
                skills: newSkills,
                states: statesList,
                status,
                plot,
                resultFight: result.resultFight,
                totalData,
            })
        } catch (error) {
            return next(error)
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
                    avatar: immortality.avatar,
                    hp: immortality.status.HP,
                    mp: immortality.status.MP,
                    currentHP: immortality.currentlyStatus.currentlyHP,
                    currentMP: immortality.currentlyStatus.currentlyMP,
                    status: immortality.status,
                }
                newImmortalities[immortality.index] = newImmortality
            })

            return newImmortalities
        }

        function collectSkills(skills) {
            let totalData = 0
            const newSkills = Object.keys(skills).reduce((result, key) => {
                if (!result[key]) {
                    const newSkill = {
                        name: key,
                        amount: 5,
                        style: skills[key].floor.mainEffect.effect.style,
                        animation: skills[key].floor.mainEffect.effect.animation,
                        startIs: skills[key].floor.startIs,
                        delay: skills[key].floor.mainEffect.delay,
                        effects: {
                            sky: skills[key].floor.mainEffect.sky,
                            figure: skills[key].floor.mainEffect.figure,
                            action: skills[key].floor.mainEffect.effect.action,
                        }
                    }
                    result[key] = newSkill
                    totalData += result[key].amount
                }
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

            function increaseStatusFromLevel(levels, immortality) {
                Object.keys(levels).forEach( nameLevel => {
                    Object.keys(levels[nameLevel]).forEach( step => {
                        if (isLargerOrEqual(levels, immortality.level, nameLevel, step)) {
                            Object.keys(immortality.status).forEach( property => {
                                const eraseX = levels[nameLevel][step].increase.substr(1)
                                const increase = Number.parseFloat(eraseX)
                                immortality.status[property] *= increase
                            })
                        }
                    })
                })
            }

            function increaseFromEquipment(equipments, immortalitiesUser) {
                equipments.forEach( equip => {
                    immortalitiesUser.forEach( immortality => {
                        if (immortality._id.toString() == equip.wearIs.toString()) {
                            // console.log(equip)
                            immortality.status[equip.equip.property.type] += equip.equip.property.value
                        }
                    })
                })
            }
        }

        function mountedField(field, immortalities) {
            immortalities.forEach(immortality => {
                field[immortality.index] = {
                    isActor: false,
                    index: immortality.index,
                    currentlyStatus: {...immortality.status},
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

                field[immortality.index].currentlyStatus.HP = immortality.currentlyStatus.currentlyHP
                field[immortality.index].currentlyStatus.MP = immortality.currentlyStatus.currentlyMP
            })
        }

        async function mountedSkill(immortalities) {
            for(let e of immortalities) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key}).populate({ path: 'floors.activities.operateEveryRoundStates.effect' })
                                                                .populate({ path: 'floors.activities.toKeepStatesAlive.effect' })
                                                                .populate({ path: 'floors.mainEffect.effect' })
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }
        }
    }

    // [POST] /api/quests
    async create(req, res, next) {
        const body = req.body
        try {
            const initiallyQuest = new Quest(body)
            const result = await initiallyQuest.save()
            console.log(result)
            return res.json(result)
        } catch (error) {
            next(error)
        }
    }

    // [POST] /api/quests/:id/clusters
    async createCluster(req, res, next) {
        const id = req.params.id
        const body = req.body
        try {
            console.log(id)
            const quest = await Quest.findById(id)
            const frontCluster = quest.clusters[quest.clusters.length - 1]

            // when front is not specified and clusters different empty
            if (!body.front && quest.clusters.length > 0) {
                body.front = frontCluster.name
            }

            quest.clusters.push(body)
            const result = await quest.save()
            console.log(result)
            return res.json(result)
        } catch (error) {
            next(error)
        }
    }

    // [PATCH] /api/quests/:idQuest/clusters/:idCluster/immortalities
    async updateClustersImmortality(req, res, next) {
        const idQuest = req.params.idQuest
        const idCluster = req.params.idCluster
        const body = req.body

        try {
            const quest = await Quest.findById(idQuest)
            const index = quest.clusters.find(cluster => cluster._id == idCluster)
            if (index) {
                body.clustersQuest = index._id
                const initiallyImmortality = new Immortality(body)

                const result = await initiallyImmortality.save()
                return res.json(result)
            }

            return next(new Error('Cụm không tồn tại!'))
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = new QuestController
