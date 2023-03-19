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

            const { whos, levels, typeOfActivity, typeOfTarget } = await Setup.findOne().lean()
            // console.log(levels, typeOfActivity, typeOfTarget)

            // user
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip', })
            const equipmentsOfUser = user.bag.equipments
            const immortalitiesUser = await Immortality.find({user: idUser})
            // mounted skills
            for(let e of immortalitiesUser) {
                const avatar = await Avatar.findOne({name: e.avatar})
                e.effects = avatar.effects

                for(let key in e.skills) {
                    const skill = await Skill.findOne({name: key}).populate({ path: 'floors.activities.effect' })
                    const skill2 = await Skill.findOne({name: key}).populate({ path: 'floors.activities.statesBonus.effect' })
                    console.log(skill.floors[0].activities[0].effect)
                    console.log(skill2.floors[0].activities[0].statesBonus[0].effect)
                    e.skills[key].description = skill.description
                    e.skills[key].floor = skill.floors.find((floor) => floor.name == e.skills[key].floor)
                }
            }
            // increase
            increase(levels, immortalitiesUser, equipmentsOfUser)
            
            // cluster
            const quest = await Quest.findById(idQuest).populate({ path: 'clusters.immortalities' })
            const cluster = quest.clusters.find( cluster => idCluster == cluster._id.toString() )
            const immortalitiesCluster = cluster.immortalities
            // mounted skills
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

            // pointer to mountLeftField and mountRightField
            const immortalitiesLeft = Object.keys(mountLeftField).map(key => mountLeftField[key])
            const immortalitiesRight = [...immortalitiesCluster]
            immortalitiesLeft.sort((a, b) => a.index - b.index)
            immortalitiesRight.sort((a, b) => a.index - b.index)

            // const queue = new queueMicrotask // ??

            // field[immortality.index].actor == !actorFlag => will be actor
            let actorFlagYou = true
            let actorFlagDefense = true
            for(let round = 0; round < 2; round ++) {
                const you = 1
                const defense = -1
                const roundHistory = {
                    you: {},
                    defense: {},
                }

                const resultYou = createPlot(round, whos, you, leftField, plot, roundHistory, mountLeftField, immortalitiesLeft, actorFlagYou, mountRightField, immortalitiesRight, typeOfActivity, typeOfTarget)
                actorFlagYou = resultYou.actorFlag
                
                const resultDefense = createPlot(round, whos, defense, rightField, plot, roundHistory, mountRightField, immortalitiesRight, actorFlagDefense, mountLeftField, immortalitiesLeft, typeOfActivity, typeOfTarget)
                actorFlagDefense = resultDefense.actorFlag
            }

            // console.log('\n\n\nresult: ')
            // console.log('mountLeftField: ', mountLeftField)
            // console.log('mountRightField: ', mountRightField)
            // console.log('Immortality User: ', immortalitiesUser)
            // console.log('Immortality Cluster: ', immortalitiesCluster)
            // console.log(plot)
            // plot.forEach((round, index) => console.log(index, round.you.effects, round.defense.effects, '\n'))
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
                    index: immortality.index,
                    currentStatus: {...immortality.currentlyStatus},
                    status: {...immortality.status},
                    skills: {...immortality.skills},
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

        function createPlot(round, whos, who, field, plot, roundHistory, mainImmortalitiesObject, mainImmortalitiesArray, actorFlag, enemyImmortalitiesObject, enemyImmortalitiesArray, typeOfActivity, typeOfTarget) {
            const whoAmI = (who > 0 ? 'you' : 'defense')
            const skillsList = []
            const findActorResult = findActor(mainImmortalitiesArray, undefined, actorFlag)
            const actor = findActorResult.actor
            actorFlag = findActorResult.actorFlag
            // find row of actor
            const rowOfActor = findRowOfActor(actor, field)

            roundHistory[whoAmI].actor = actor
            roundHistory[whoAmI].effects = []

            if (actor != undefined && rowOfActor != -1) {
                // pointer to mainImmortalitiesObject[actor].states
                const states = mainImmortalitiesObject[actor].states
                Object.keys(states).forEach(key => {})

                // Skill keys
                const skillKeys = Object.keys(mainImmortalitiesObject[actor].skills)
                // random select skill
                const skillIndex = Math.floor(Math.random() * Object.keys(mainImmortalitiesObject[actor].skills).length)
                // console.log(skillIndex)
                const skillKey = skillKeys[skillIndex]
                skillsList.push(skillKey)
                // pointer to mainImmortalitiesObject[actor].skills['Hỏa Cầu'].floor.activities
                const activities = mainImmortalitiesObject[actor].skills[skillKey].floor.activities
                activities.forEach(activity => {
                    const typeEffect = (activity.property.value < 0) ? 'damages' : 'heals'
                    const targetOfActivitiesObject = (whos[activity.who] < 0) ? enemyImmortalitiesObject : mainImmortalitiesObject
                    const targetOfActivitiesArray = (whos[activity.who] < 0) ? enemyImmortalitiesArray : mainImmortalitiesArray
                    const otherOfActivitiesObject = (whos[activity.who] >= 0) ? enemyImmortalitiesObject : mainImmortalitiesObject
                    const otherOfActivitiesArray = (whos[activity.who] >= 0) ? enemyImmortalitiesArray : mainImmortalitiesArray
                    // console.log(targetOfActivitiesObject)
                    // console.log(activity.statesBonus)
                    const effect = {
                        type: 'skill',
                        name: skillKey,
                        objects: [],
                        [typeEffect]: []
                    }

                    switch (activity.typeOfActivity) {
                        case 'first': //enemy <=> whos[activity.who] < 0
                        case 'last': //enemy <=> whos[activity.who] < 0
                            switch(activity.typeOfTarget) {
                                case 'all':
                                    targetOfActivitiesArray.forEach(immortality => {
                                        handleComputedDamage(whos, who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                        if (immortality) {
                                            activity.statesBonus.forEach(state => {
                                                if (whos[state.who] < 0) { // side immortality's enemy
                                                    // immortality?.states[]
                                                }
                                            })
                                        }
                                    })
                                    // erase element have hp <= 0
                                    handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray)
                                    break
                                default: // col, row, single
                                    const locationOfTarget = findTarget(rowOfActor, typeOfActivity[activity.typeOfActivity],
                                                        field, targetOfActivitiesObject)
                                    if (locationOfTarget.col != -1) {
                                        const vectorArguments = typeOfTarget[activity.typeOfTarget]
                                        
                                        if (vectorArguments.x > 0) {
                                            locationOfTarget.col = field.length - 1
                                            for(locationOfTarget.col; locationOfTarget.col > 0; locationOfTarget.col --) {
                                                // console.log(`Attack ${locationOfTarget.row} ${locationOfTarget.col}`)
                                                const index = field[locationOfTarget.col][locationOfTarget.row]
                                                const targetImmortality = targetOfActivitiesObject[ index ]
                                                handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                                
                                                if (targetImmortality) {
                                                    activity.statesBonus.forEach(state => {
                                                        if (whos[state.who] < 0) { // side immortality's enemy
                                                            targetImmortality?.states.push(state)
                                                        }
                                                    })
                                                }
                                            }
                                            // erase element have hp <= 0
                                            handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesObject)
                                        }
                                        if (vectorArguments.y > 0) {
                                            locationOfTarget.row = field[0].length - 1
                                            for(locationOfTarget.row; locationOfTarget.row > 0; locationOfTarget.row --) {
                                                const index = field[locationOfTarget.col][locationOfTarget.row]
                                                const targetImmortality = targetOfActivitiesObject[ index ]
                                                handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                                
                                                if (targetImmortality) {
                                                    activity.statesBonus.forEach(state => {
                                                        if (whos[state.who] < 0) { // side immortality's enemy
                                                            targetImmortality?.states.push(state)
                                                        }
                                                    })
                                                }
                                            }
                                            // erase element have hp <= 0
                                            handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray)
                                        }

                                        // Case element be effected first
                                        const index = field[locationOfTarget.col][locationOfTarget.row]
                                        const targetImmortality = targetOfActivitiesObject[index]
                                        handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                        
                                        if (targetImmortality) {
                                            activity.statesBonus.forEach(state => {
                                                if (whos[state.who] < 0) { // side immortality's enemy
                                                    targetImmortality?.states.push(state)
                                                }
                                            })
                                        }
                                        // console.log(targetImmortality)
                                        // erase element have hp <= 0
                                        handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray)
                                    }
                                    break
                            }
                            break
                        case 'you': // all, single, not have col, row  <=> whos[activity.who] >= 0
                            switch(activity.typeOfTarget) {
                                case 'all':
                                    targetOfActivitiesArray.forEach(immortality => {
                                        handleComputedDamage(whos, who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                        if (immortality) {
                                            activity.statesBonus.forEach(state => {
                                                if (whos[state.who] >= 0) { // side immortality's main
                                                    immortality?.states.push(state)
                                                }
                                            })
                                        }
                                    })
                                    handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray)
                                    break
                                case 'single': // single - you => this immortality's activity
                                    const targetImmortality = targetOfActivitiesObject[actor]
                                    handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)
                                    if (targetImmortality) {
                                        activity.statesBonus.forEach(state => {
                                            if (whos[state.who] >= 0) { // side immortality's main
                                                targetImmortality?.states.push(state)
                                            }
                                        })
                                    }
                                    handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray)
                                    break
                            }
                            break
                    }

                    roundHistory[whoAmI].effects.push(effect)
                })

                plot.push(roundHistory)
            }

            return { plot, roundHistory, skillsList, mainImmortalitiesObject, mainImmortalitiesArray, actorFlag }
        }

        function findActor(immortalities, actor, actorFlag) {
            immortalities.some( immortality => {
                // if it not attack then attack
                if (immortality?.actor != actorFlag) {
                    // console.log(immortality)
                    actor = immortality.index
                    immortality.actor = actorFlag
                    return true
                }
            })

            // last element still not is selected
            if (!actor && immortalities.length > 0) {
                // reverse actorFlag so that can't change mountField[numData].actor
                return findActor(immortalities, actor, !actorFlag)
            }

            return { actor, actorFlag }
        }

        function findRowOfActor(actor, field) {
            let rowOfActor = -1
            field.forEach(col => {
                for(let row = 0; row < col.length; row ++) {
                    if (col[row] == actor) rowOfActor = row
                }
            })

            return rowOfActor
        }

        function findTarget(rowOfActor, typeOfActivity, field, mountFieldTarget) {
            for(let row = rowOfActor; row >= 0; row --) {
                for(let col = typeOfActivity.col; stopCondition(typeOfActivity, col); col = computedColumn(typeOfActivity, col)) {
                    if (mountFieldTarget[field[col][row]]) {
                        return { col, row }
                    }
                }
            }

            for(let row = rowOfActor; row < field[0].length; row ++) {
                for(let col = typeOfActivity.col; stopCondition(typeOfActivity, col); col = computedColumn(typeOfActivity, col)) {
                    if (mountFieldTarget[field[col][row]]) {
                        return { col, row }
                    }
                }
            }

            return { col: -1, row: -1 }

            function computedColumn(typeOfActivity, col) {
                if (typeOfActivity.col == 0) {
                    col ++
                } else if (typeOfActivity.col == 2) {
                    col --
                }

                return col
            }

            function stopCondition(typeOfActivity, col) {
                return (typeOfActivity.col == 0 && col < field.length) 
                        || (typeOfActivity.col == 2 && col >= 0)
            }
        }

        function handleComputedDamage(whos, who, targetImmortalityObject, targetOfImmortalitiesObject, effect, typeEffect, activity) {
            if (targetImmortalityObject) {
                targetImmortalityObject.currentStatus.currentlyHP -= (-activity.property.value)
                effect.objects.push(targetImmortalityObject.index * who * whos[activity.who])
                effect[typeEffect].push(activity.property.value)
            }
            if (targetImmortalityObject.currentStatus.currentlyHP <= 0) {
                delete targetOfImmortalitiesObject[target.index]
                
            }
        }

        function handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesArray) {
            const newImmortalities = Object.keys(targetOfActivitiesObject).map(key => targetOfActivitiesObject[key])
            newImmortalities.forEach((immortality, index) => targetOfActivitiesArray[index] = immortality)
            while(newImmortalities.length != targetOfActivitiesArray.length) {
                targetOfActivitiesArray.pop()
            }
        }

        // function addState(actor, state) {

        // }
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
