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
            const avatars = {}
            const user = await User.findById(idUser).populate({ path: 'bag.equipments.equip', })
            const equipmentsOfUser = user.bag.equipments
            const immortalitiesUser = await Immortality.find({user: idUser})
            await collectAvatars(avatars, immortalitiesUser)
            // mounted skills
            await mountedSkill(immortalitiesUser)
            // increase
            increase(levels, immortalitiesUser, equipmentsOfUser)
            
            // cluster
            const quest = await Quest.findById(idQuest).populate({ path: 'clusters.immortalities' })
            const cluster = quest.clusters.find( cluster => idCluster == cluster._id.toString() )
            const immortalitiesCluster = cluster.immortalities
            await collectAvatars(avatars, immortalitiesCluster)
            // mounted skills
            await mountedSkill(immortalitiesCluster)
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
            // const immortalitiesLeft = Object.keys(mountLeftField).map(key => mountLeftField[key])
            // const immortalitiesRight = [...immortalitiesCluster]
            // immortalitiesLeft.sort((a, b) => a.index - b.index)
            // immortalitiesRight.sort((a, b) => a.index - b.index)

            // const queue = new queueMicrotask // ??

            let skillsList = {}
            let statesList = []
            let resultFight = 'Thắng'
            // field[immortality.index].actor == !actorFlag => will be actor
            let actorFlagYou = true
            let actorFlagDefense = true
            let round = 0
            for(round;
                    Object.keys(mountLeftField).length > 0 && Object.keys(mountRightField).length > 0
                    && round < maxRound;
                round ++) {
                console.log(Object.keys(mountLeftField).length, Object.keys(mountRightField).length, Object.keys(mountLeftField).length > 0 && Object.keys(mountRightField).length > 0)
                const you = 1
                const defense = -1
                const roundHistory = {
                    you: {},
                    defense: {},
                }

                console.log(`\n--------------------------------------\nRound ${round}\n--------------------------------------\n`)
                const resultYou = createPlot(round, whos, you, leftField, plot, roundHistory, mountLeftField, actorFlagYou, mountRightField, typeOfActivity, typeOfTarget)
                actorFlagYou = resultYou.actorFlag
                
                const resultDefense = createPlot(round, whos, defense, rightField, plot, roundHistory, mountRightField, actorFlagDefense, mountLeftField, typeOfActivity, typeOfTarget)
                actorFlagDefense = resultDefense.actorFlag
                console.log(mountLeftField, mountRightField)
                console.log(`\n--------------------------------------\n`)


                Object.assign(skillsList, resultYou.skillsList, resultDefense.skillsList)
                statesList = statesList.concat(resultYou.statesList, resultDefense.statesList)
                plot.push(roundHistory)
            }

            if (round >= maxRound || Object.keys(mountRightField).length > 0) {
                resultFight = 'Thất Bại'
            } else if (Object.keys(mountLeftField).length == 0 && Object.keys(mountRightField).length == 0) {
                resultFight = 'Hòa'
            }

            statesList = statesList.reduce((result, state) => {
                const newState = {
                    name: state.name,
                    image: state.image,
                    effect: state.action,
                    style: state.style,
                    animation: state.animation,
                    amount: 1,
                }

                if (result[state.name] && result[state.name].amount < 10) {
                    result[state.name].amount += 1
                } else if (!result[state.name]) {
                    result[state.name] = newState
                }
                return result
            }, {})

            const leftImmortalities = collectImmortality(immortalitiesUser, whos, 'you')
            const rightImmortalities = collectImmortality(immortalitiesUser, whos, 'defense')
            const status = {
                you: leftImmortalities,
                defense: rightImmortalities,
            }
            const skills = collectSkills(skillsList)
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
            // plot.forEach((round, index) => console.log(index, round.you.effects, round.defense.effects, '\n'))
            console.log('\n\nThe End!')
            return res.json({
                avatars,
                skills,
                states: statesList,
                status,
                plot,
                resultFight,
            })
        } catch (error) {
            return next(error)
        }

        async function collectAvatars(avatars, immortalities) {
            for(const immortality of immortalities) {
                const newAvatar = await Avatar.findOne({ name: immortality.avatar })
                if (newAvatar) {
                    avatars[newAvatar.name] = newAvatar.effects
                }
            }
        }

        function collectImmortality(immortalities, whos, who) {
            const newImmortalities = {}
            immortalities.forEach(immortality => {
                const newImmortality = {
                    index: immortality.index * whos[who],
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
                }
                return result
            }, {})

            return newSkills
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

        function createPlot(round, whos, who, field, plot, roundHistory, mainImmortalitiesObject, actorFlag, enemyImmortalitiesObject, typeOfActivity, typeOfTarget) {
            const whoAmI = (who < 0 ? 'you' : 'defense')
            const skillsList = []
            const statesList = []
            const findActorResult = findActor(field, mainImmortalitiesObject, undefined, actorFlag)
            const indexActor = findActorResult.indexActor
            actorFlag = findActorResult.actorFlag
            // find row of actor
            const rowOfActor = findRowOfActor(indexActor, field)

            roundHistory[whoAmI].actor = indexActor * who
            roundHistory[whoAmI].effects = []

            const effectPreStatus = []

            // console.log(actorFlag)
            if (indexActor != undefined && rowOfActor != -1) {
                // console.log('mainImmortalitiesObject: ', mainImmortalitiesObject, '\n########\n')
                // pointer to actor immortality
                const actorImmortality = mainImmortalitiesObject[indexActor]
                // console.log('index: ', indexActor, 'this immortality: ', actorImmortality)
                // pointer to mainImmortalitiesObject[indexActor].operateEveryRoundStates
                const operateEveryRoundStates = actorImmortality?.operateEveryRoundStates || undefined
                if (operateEveryRoundStates &&
                    Object.keys(mainImmortalitiesObject).length > 0 &&
                    Object.keys(enemyImmortalitiesObject).length > 0
                ) {
                    Object.keys(operateEveryRoundStates).forEach(key => {
                        const { type, value } = operateEveryRoundStates[key].property
                        const typeEffect = findTypeEffect(value)
                        const t = typeEffect.substring(0, typeEffect.length - 1)
                        const effect = {
                            type: t,
                            [typeEffect]: [value]
                        }
                        console.log(type, value, "timeline: ", operateEveryRoundStates[key].timeline)
                        actorImmortality.currentlyStatus[type] -= -(value)
    
                        operateEveryRoundStates[key].timeline -= 1
                        if (operateEveryRoundStates[key].timeline <= 0) {
                            const effect = {
                                type: 'remove',
                                name: key,
                            }
                            effectPreStatus.push(effect)
                            delete operateEveryRoundStates[key]
                        }
                        console.log('KQ: ', actorImmortality.currentlyStatus[type])
    
                        effectPreStatus.push(effect)
                    })
                }
                // pointer to mainImmortalitiesObject[indexActor].toKeepStatesAlive
                const toKeepStatesAlive = mainImmortalitiesObject[indexActor]?.toKeepStatesAlive || undefined
                if (toKeepStatesAlive &&
                    Object.keys(mainImmortalitiesObject).length > 0 &&
                    Object.keys(enemyImmortalitiesObject).length > 0
                ) {
                    Object.keys(toKeepStatesAlive).forEach(key => {
                        // console.log("timeline: ", toKeepStatesAlive[key].timeline)
                        toKeepStatesAlive[key].timeline -= 1
    
                        if (toKeepStatesAlive[key].timeline <= 0) {
                            const effect = {
                                type: 'remove',
                                name: key,
                            }
                            effectPreStatus.push(effect)
                            delete toKeepStatesAlive[key]
                        }
                    })
                }

                roundHistory[whoAmI].effects = roundHistory[whoAmI].effects.concat(effectPreStatus)

                // Skill keys
                const skillKeys = Object.keys(mainImmortalitiesObject[indexActor].skills)
                // random select skill
                const skillIndex = Math.floor(Math.random() * Object.keys(mainImmortalitiesObject[indexActor].skills).length)
                // console.log(skillIndex)
                const skillKey = skillKeys[skillIndex]
                skillsList[skillKey] = mainImmortalitiesObject[indexActor].skills[skillKey]
                // pointer to mainImmortalitiesObject[indexActor].skills['Hỏa Cầu'].floor.activities
                const activities = mainImmortalitiesObject[indexActor].skills[skillKey].floor.activities
                for (const activity of activities) {
                    if (
                        Object.keys(mainImmortalitiesObject).length == 0 &&
                        Object.keys(enemyImmortalitiesObject).length == 0
                    ) {
                        break
                    }
                    const typeEffect = findTypeEffect(activity.property.value)
                    const targetOfActivitiesObject = (whos[activity.who] < 0) ? enemyImmortalitiesObject : mainImmortalitiesObject
                    // console.log(targetOfActivitiesObject)
                    // console.log(activity.statesBonus)
                    const effect = {
                        type: 'skill',
                        name: skillKey,
                        objects: [],
                        [typeEffect]: []
                    }
                    const effectAfterSkill = []

                    switch (activity.typeOfActivity) {
                        case 'first': //enemy <=> whos[activity.who] < 0
                        case 'last': //enemy <=> whos[activity.who] < 0
                            switch(activity.typeOfTarget) {
                                case 'all':
                                    Object.keys(targetOfActivitiesObject).forEach(key => {
                                        const immortality = targetOfActivitiesObject[key]
                                        handleComputedDamage(whos, who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                        if (mainImmortalitiesObject[indexActor] && immortality) {
                                            const mainImmortality = mainImmortalitiesObject[indexActor]

                                            addState(whos, statesList, mainImmortality, immortality, activity.operateEveryRoundStates, effectAfterSkill)
                                            addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                        }
                                    })
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

                                                if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                                    const mainImmortality = mainImmortalitiesObject[indexActor]

                                                    addState(whos, statesList, mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                                    addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
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

                                                if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                                    const mainImmortality = mainImmortalitiesObject[indexActor]

                                                    addState(whos, statesList, operateEveryRoundStatesMain, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                                    addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                                }
                                            }
                                        }

                                        // Case element be effected first
                                        const index = field[locationOfTarget.col][locationOfTarget.row]
                                        const targetImmortality = targetOfActivitiesObject[index]
                                        handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                        if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                            const mainImmortality = mainImmortalitiesObject[indexActor]

                                            addState(whos, statesList, mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                            addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                        }
                                        // console.log('\n\n', indexActor, mainImmortalitiesObject[indexActor].operateEveryRoundStates, '\n', index, targetImmortality.operateEveryRoundStates)
                                    }
                                    break
                            }
                            break
                        case 'you': // all, single, not have col, row  <=> whos[activity.who] >= 0
                            switch(activity.typeOfTarget) {
                                case 'all':
                                    Object.keys(targetOfActivitiesObject).forEach(key => {
                                        const immortality = targetOfActivitiesObject[key]
                                        handleComputedDamage(whos, who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                        if (mainImmortalitiesObject[indexActor] && immortality) {
                                            const mainImmortality = mainImmortalitiesObject[indexActor]

                                            addState(whos, statesList, mainImmortality, immortality, activity.operateEveryRoundStates, effectAfterSkill)
                                            addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                        }
                                    })
                                    break
                                case 'single': // single - you => this immortality's activity
                                    const targetImmortality = targetOfActivitiesObject[indexActor]
                                    handleComputedDamage(whos, who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                    if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                        const mainImmortality = mainImmortalitiesObject[indexActor]

                                        addState(whos, statesList, mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                        addKeepStateAlive(whos, who, statesList, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                    }
                                    // console.log('\n\n', indexActor, mainImmortalitiesObject[indexActor].operateEveryRoundStates, '\n', indexActor, targetImmortality.operateEveryRoundStates)
                                    break
                            }
                            break
                    }

                    roundHistory[whoAmI].effects.push(effect)
                    // console.log('\n\n\n\nroundHistory: ', roundHistory[whoAmI].effects)
                    roundHistory[whoAmI].effects = roundHistory[whoAmI].effects.concat(effectAfterSkill)
                    // console.log('roundHistory: ', roundHistory[whoAmI].effects)
                    if (
                        Object.keys(mainImmortalitiesObject).length == 0 &&
                        Object.keys(enemyImmortalitiesObject).length == 0
                    ) {
                        break
                    }
                }
                
                // console.log('mainImmortalitiesObject: ', mainImmortalitiesObject, '\n########\n')
                // console.log('enemyImmortalitiesObject: ', enemyImmortalitiesObject, '\n########\n')
            }

            return { plot, roundHistory, skillsList, statesList, mainImmortalitiesObject, actorFlag }
        }

        function findActor(field, immortalities, indexActor, actorFlag) {
            for(let col = 0; col < field.length; col++) {
                for(let row = 0; row < field[col].length; row++) {
                    const index = field[col][row]
                    const immortality = immortalities[index]
                    // if it not attack then attack
                    if (immortality && immortality?.isActor != actorFlag) {
                        // console.log(immortality)
                        indexActor = immortality.index
                        immortality.isActor = actorFlag
                        return { indexActor, actorFlag }
                    }
                }
            }
            // immortalities.some( immortality => {
            //     // if it not attack then attack
            //     if (immortality?.isActor != actorFlag) {
            //         // console.log(immortality)
            //         indexActor = immortality.index
            //         immortality.isActor = actorFlag
            //         return true
            //     }
            // })

            // last element still not is selected
            if (!indexActor && Object.keys(immortalities).length > 0) {
                // reverse actorFlag so that can't change mountField[numData].actor
                return findActor(field, immortalities, indexActor, !actorFlag)
            }

            return { indexActor, actorFlag }
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

        function findTypeEffect(valueProperty) {
            if (valueProperty >= 0) return 'heals';
            return 'damages'
        }

        function handleComputedDamage(whos, who, targetImmortalityObject, targetImmortalitiesObject, effect, typeEffect, activity) {
            if (targetImmortalityObject) {
                console.log(targetImmortalityObject.currentlyStatus.HP, 'type: ', activity.property.type)
                targetImmortalityObject.currentlyStatus[activity.property.type] -= (-activity.property.value)

                effect.objects.push(targetImmortalityObject.index * who * whos[activity.who])
                effect[typeEffect].push(activity.property.value)

                if (targetImmortalityObject.currentlyStatus.HP <= 0) {
                    delete targetImmortalitiesObject[targetImmortalityObject.index]
                }
            }

        }

        function handleComputedDamageFromState(whos, who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state) {
            if (targetImmortalityObject) {
                const actionEffect = {
                    type: 'action',
                    name: state.effect.name,
                    objects: [targetImmortalityObject.index * who * whos[state.who]],
                }
                effectStates.push(actionEffect)
                const effect = {
                    type: typeEffect.substring(0, typeEffect.length - 1),
                    objects: [],
                    [typeEffect]: []
                }
                
                targetImmortalityObject.currentlyStatus[state.property.type] -= (-state.property.value)

                effect.objects.push(targetImmortalityObject.index * who * whos[state.who])
                effect[typeEffect].push(state.property.value)
                effectStates.push(effect)

                if (targetImmortalityObject.currentlyStatus.HP <= 0) {
                    delete targetImmortalitiesObject[targetImmortalityObject.index]
                }
            }
        }

        function addState(whos, statesList, who, mainImmortality, targetImmortality, operateEveryRoundStates, effectStates) { // other: thisImmortality, immortalities same same field
            const statesOfMainImmortality = mainImmortality.operateEveryRoundStates
            const statesOfTargetImmortality = targetImmortality.operateEveryRoundStates

            operateEveryRoundStates.forEach(state => {
                statesList.push(new Object(state.effect))
                const actionEffect = {
                    type: 'action',
                    name: state.effect.name,
                    objects: [],
                }
                if (whos[state.who] < 0) { // enemy
                    if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfTargetImmortality[state.effect.name] = state
                        actionEffect.objects.push(targetImmortality.index * who * whos[state.who])
                    }
                } else if (whos[state.who] > 0) { //you
                    if ( ! statesOfMainImmortality[state.effect.name] || statesOfMainImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfMainImmortality[state.effect.name] = state
                        actionEffect.objects.push(mainImmortality.index * who * whos[state.who])
                    }
                } else if (whos[state.who] == 0) { // other from your field
                    if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfTargetImmortality[state.effect.name] = state
                        actionEffect.objects.push(targetImmortality.index * who * whos[state.who])
                    }
                }
                effectStates.push(actionEffect)
            })
        }

        function addKeepStateAlive(whos, who, statesList, mainImmortalityObject, mainImmortalitiesObject, targetImmortalityObject, targetImmortalitiesObject, operateEveryRoundStates, effectStates) { // other: thisImmortality, immortalities same same field
            const statesOfMainImmortality = mainImmortalityObject.toKeepStatesAlive
            const statesOfTargetImmortality = targetImmortalityObject.toKeepStatesAlive

            operateEveryRoundStates.forEach(state => {
                statesList.push(new Object(state.effect))
                const typeEffect = findTypeEffect(state.property.value)
                if (whos[state.who] < 0) { // enemy
                    if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfTargetImmortality[state.effect.name] = state

                        handleComputedDamageFromState(whos, who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state)
                    }
                } else if (whos[state.who] > 0) { //you
                    if ( ! statesOfMainImmortality[state.effect.name] || statesOfMainImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfMainImmortality[state.effect.name] = state

                        handleComputedDamageFromState(whos, who, mainImmortalityObject, mainImmortalitiesObject, effectStates, typeEffect, state)
                    }
                } else if (whos[state.who] == 0) { // other from your field
                    if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                        statesOfTargetImmortality[state.effect.name] = state

                        handleComputedDamageFromState(whos, who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state)
                    }
                }
            })
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
