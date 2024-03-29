const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { Quest, Immortality, Setup, User, Skill, Avatar, Fight } = require('../models')

class QuestController {
    // [GET] /api/quests
    async getAll(req, res, next) {
        try {
            const quest = await Quest.find({}, '_id name front')

            return res.json(quest)
        } catch (error) {
            return next(error)
        }
    }

    // [GET] /api/quests/:id
    async get(req, res, next) {
        const idUser = req.session.passport.user._id
        const idQuest = req.params.id

        try {
            const { levels } = await Setup.findOne().lean()
            const user = await User.findById(idUser)

            const result = await Quest.findById(idQuest).populate({
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

            let historyForQuest = {}
            // this quest is not clear
            const current = user.quests[result.name].current
            const next = user.quests[result.name].next

            Object.assign(historyForQuest, current, next)

            console.log('History: ', historyForQuest)

            const clusters = result.clusters.filter(cluster => {
                // cluster that user won and next cluster
                if ( historyForQuest[cluster.name] ) {
                    const largestImmortality = cluster.immortalities.reduce((largest, e) => {
                        // find largest level
                        largest = new Object(findLargestLevel(levels, largest, e))
    
                        return largest
                    }, new Object(cluster.immortalities[0]))
    
                    cluster.maxLevel = largestImmortality.level ? {...largestImmortality.level} 
                                        : {name: 'Luyện Khí Kì', level: 'Tầng 1'}

                    return true
                }
                return false
            })
            result.clusters = clusters
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

    // [GET] /api/users/:id/quests
    async getAllQuests(req, res, next) {
        try {
            const idUser = req.params.id
            const user = await User.findById(idUser)

            let aNumberOfIsNextQuestTrue = 0
            const questsName = Object.keys(user.quests).reduce((total, questKey) => {
                if (user.quests[questKey].isNext) {
                    aNumberOfIsNextQuestTrue += 1
                }
                total.push(questKey)
                return total
            }, [])

            let quests = await Quest.find({name: { $in: questsName }})

            // When have new quest is updated by me
            if (aNumberOfIsNextQuestTrue == Object.keys(user.quests).length) {
                const firstQuest = quests.find(quest => quest.front == '')
                let lastQuest = firstQuest
                let currentTotalQuests = 1
                while(currentTotalQuests < Object.keys(user.quests).length) {
                    for(let quest of quests) {
                        if (quest.front == lastQuest.name) {
                            lastQuest = quest
                            currentTotalQuests += 1
                        }
                    }
                }

                const newQuest = await Quest.findOne({ front: lastQuest.name })

                quests = quests.concat(newQuest)
            }

            return res.json(quests)
        } catch (error) {
            return next(error)
        }
    }

    // [GET] /api/quests/:idQuest/clusters/:idCluster/fight
    async fight(req, res, next) {
        const idQuest = req.params.idQuest
        const idCluster = req.params.idCluster

        try {
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
            
            // cluster
            const quest = await Quest.findById(idQuest)
                .populate({ path: 'clusters.immortalities' })
                .populate({ path: 'clusters.awards.items.item' })
                .populate({ path: 'clusters.awards.skills.skill' })
                .populate({ path: 'clusters.awards.equipments.equip' })
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
            const receivedAwards = []
            if (resultFight == stateFight.win) {
                const currentQuestName = quest.name
                const clusterNameIsAttack = cluster.name

                const currentCluster = user.quests[currentQuestName].current
                currentCluster[clusterNameIsAttack] = clusterNameIsAttack

                // list cluster user will have to attack
                const nextClusters = user.quests[currentQuestName].next
                // inspect cluster attacked have on next clusters
                const isNextCluster =
                    Object.keys(nextClusters).some(clusterKey => {
                        if (nextClusters[clusterKey] == clusterNameIsAttack) {
                            delete nextClusters[clusterKey]
                            return true
                        }
                        return false
                    })

                console.log(isNextCluster)
                if (isNextCluster) {
                    console.log('Next cluster')
                    // filter return array next cluster
                    const newNextClusters = quest.clusters.filter(cluster => cluster.front == clusterNameIsAttack)
                    if (newNextClusters && newNextClusters.length > 0) {
                        newNextClusters.forEach(newNextCluster => {
                            const newNextClusterName = newNextCluster.name
                            nextClusters[newNextClusterName] = newNextClusterName
                        })
                    } else {
                        // (isNextCluster && nextCluster.length < 0) => next Quest
                        console.log('Next quest')
                        user.quests[currentQuestName].isNext = true
                        const newQuests = await Quest.find({front: currentQuestName})
                        if (newQuests.length > 0) {
                            newQuests.forEach(newQuest => {
                                const nextClusterOfNewQuests = newQuest.clusters.filter(cluster => cluster.front == '')
                                user.quests[newQuest.name] = {
                                    current: {},
                                    next: {},
                                    isNext: false,
                                }
        
                                nextClusterOfNewQuests.forEach(newCluster => {
                                    const newNextClusterName = newCluster.name
                                    user.quests[newQuest.name].next[newNextClusterName] = newNextClusterName
                                })
                            })
                        }
                    }
                    console.log(user.quests)
                    await User.updateOne({ _id: user._id }, { quests: user.quests })
                }

                // Gift
                const bag = user.bag
                const awards = cluster.awards
                const rateItems = Array(100).fill(0)
                awards.items.forEach(e => {
                    rateItems.fill(1, 0, Number.parseInt(e.rate))
                    const index = Math.floor(Math.random() * 100)
                    if (rateItems[index] == 1) {
                        receivedAwards.push(e)
                        const index = bag.items.findIndex(item => {
                            return (item?.item?.toString()) == (e?.item?._id.toString())
                        })
                        if (index != -1) {
                            bag.items[index].quantity += e.quantity
                        } else {
                            bag.items.push({
                                item: e.item._id,
                                quantity: e.quantity
                            })
                        }
                    }
                    rateItems.fill(0, 0, Number.parseInt(e.rate))
                })
                awards.skills.forEach(e => {
                    rateItems.fill(1, 0, Number.parseInt(e.rate))
                    const index = Math.floor(Math.random() * 100)
                    if (rateItems[index] == 1) {
                        receivedAwards.push(e)
                        
                        bag.skills.push({
                            skill: e.skill._id,
                            quantity: e.quantity
                        })
                    }
                    rateItems.fill(0, 0, Number.parseInt(e.rate))
                })
                awards.equipments.forEach(e => {
                    rateItems.fill(1, 0, Number.parseInt(e.rate))
                    const index = Math.floor(Math.random() * 100)
                    if (rateItems[index] == 1) {
                        receivedAwards.push(e)
                        
                        bag.equipments.push({
                            equip: e.equip._id,
                            quantity: e.quantity
                        })
                    }
                    rateItems.fill(0, 0, Number.parseInt(e.rate))
                })

                await User.updateOne({ _id: user._id }, { bag: bag })
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

                if (result[state.name] && result[state.name].amount < Object.keys(immortalitiesUser).length + Object.keys(immortalitiesCluster).length) {
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
            status.defense = collectImmortality(immortalitiesCluster, players.defense)
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
            // console.log('Immortality Cluster: ', immortalitiesCluster)
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
                receivedAwards,
                defense: cluster.name
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
                skills[key].floor.activities.forEach(activity => {
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
