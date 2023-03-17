const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { Quest, Immortality, Setup, User, Skill, Avatar } = require('../models')

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

            const { levels } = await Setup.findOne().lean()

            // user
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip', })
            const equipmentsOfUser = user.bag.equipments
            const immortalitiesUser = await Immortality.find({user: idUser})

            for(let e of immortalitiesUser) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key})
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }
            // console.log("user: ", user, "\nequip: ", equipmentsOfUser)
            // console.log("Immortality: ", immortalitiesUser)
            // console.log("levels: ", levels)
            // increase
            increase(levels, immortalitiesUser, equipmentsOfUser)
            
            // cluster
            const quest = await Quest.findById(idQuest).populate({ path: 'clusters.immortalities' })
            const cluster = quest.clusters.find( cluster => idCluster == cluster._id.toString() )
            const immortalitiesCluster = cluster.immortalities

            for(let e of immortalitiesCluster) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key})
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }
            // increase
            increase(levels, immortalitiesCluster, equipmentsOfUser)

            // fight
            const maxRound = 31
            // [col][row]
            const leftField = [[1,2,3], [4,5,6], [7,8,9]] // ([[7,8,9], [4,5,6], [1,2,3]]) -> when screen
            const rightField = [[1,2,3], [4,5,6], [7,8,9]]
            const plot = []
            const mountLeftField = {}
            const mountRightField = {}
            mountedField(mountLeftField, immortalitiesUser)
            mountedField(mountRightField, immortalitiesCluster)
            // const queue = new queueMicrotask // ??

            // field[immortality.index].actor == !actorFlag => will be actor
            let actorFlag = true
            for(let round = 0; round < 6; round ++) {
                const roundHistory = {
                    you: {},
                    defense: {},
                }
                const findActorResult = findActor(leftField, mountLeftField, undefined, actorFlag)
                const actor = findActorResult.actor
                actorFlag = findActorResult.actorFlag

                if (actor != undefined) {
                    // pointer to mountLeftField[actor].states
                    const states = mountLeftField[actor].states
                    Object.keys(states).forEach(key => {})

                    // pointer to mountLeftField[actor].skills['Hỏa Cầu'].floor.activities
                    const activities = mountLeftField[actor].skills['Hỏa Cầu'].floor.activities
                    activities.forEach(activity => {
                        let x = -1
                        let y = -1
                        switch(activity.typeOfTarget) {
                            case 'all':
                                break
                            default:
                                let indexTarget
                                switch(activity.typeOfActivity) {
                                    case 'first':
                                        break
                                    case 'middle':
                                        break
                                    case 'last':
                                        break
                                }

                                switch(activity.typeOfTarget) {
                                    case 'single':
                                        x = y = 0
                                        break
                                    case 'row':
                                        x = 0
                                        y = 1
                                        break
                                    case 'col':
                                        x = 1
                                        y = 0
                                        break
                                }
                        }
                    })
                }
            }

            // console.log('\n\n\nresult: ')
            // console.log('mountLeftField: ', mountLeftField)
            // console.log('mountRightField: ', mountRightField)
            // console.log('Immortality User: ', immortalitiesUser)
            // console.log('Immortality Cluster: ', immortalitiesCluster)
            return res.json({})
        } catch (error) {
            return next(error)
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
                    actor: false,
                    currentStatus: immortality.currentlyStatus,
                    status: immortality.status,
                    skills: immortality.skills,
                    states: {}, // (key: value)
                    /**
                     * key: {
                     *  name: ,
                     *  type: ,
                     *  indicator: ,
                     *  timeline: , // each round will be subtract, == 0 => delete
                     * }
                     */
                }
            })
        }

        function findActor(field, mountField, actor, actorFlag) {
            field.forEach(col => col.some( numData => {
                // if it not attack then attack
                if (mountField[numData] && mountField[numData]?.actor != actorFlag) {
                    // console.log(numData)
                    actor = numData
                    mountField[numData].actor = actorFlag
                    return true
                }
            }))

            // last element still not is selected
            if (!actor && Object.keys(mountField).length > 0) {
                // reverse actorFlag so that can't change mountField[numData].actor
                return findActor(field, mountField, actor, !actorFlag)
            }

            return { actor, actorFlag }
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
