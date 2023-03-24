
class Fight {
    constructor(whos, players, mountLeftField, mountRightField, typeOfActivity, typeOfTarget) {
        this.round = 0
        this.maxRound = 31
        // [col][row]
        this.field = [[1,2,3], [4,5,6], [7,8,9]]
        // this.leftField = [[1,2,3], [4,5,6], [7,8,9]] // ([[7,8,9], [4,5,6], [1,2,3]]) -> when screen
        // this.rightField = [[1,2,3], [4,5,6], [7,8,9]]
        this.resultFight = 'Thắng Lợi'
        this.actorFlagYou = true
        this.actorFlagDefense = true
        this.skillsList= {}
        this.statesList = []
        this.plot = []

        this.whos = whos
        this.players = players
        this.mountLeftField = mountLeftField
        this.mountRightField = mountRightField
        this.typeOfActivities = typeOfActivity
        this.typeOfTargets = typeOfTarget

    }

    run() {
        // field[immortality.index].actor == !actorFlag => will be actor
        for(this.round;
                Object.keys(this.mountLeftField).length > 0 &&
                Object.keys(this.mountRightField).length > 0 &&
                this.round < this.maxRound;
            this.round ++
        ) {
            console.log(Object.keys(this.mountLeftField).length, Object.keys(this.mountRightField).length, Object.keys(this.mountLeftField).length > 0 && Object.keys(this.mountRightField).length > 0)
            const roundHistory = {
                you: {},
                defense: {},
            }

            console.log(`\n--------------------------------------\nRound ${this.round}\n--------------------------------------\n`)
            const resultYou = this.createPlot(roundHistory, this.players.you, this.actorFlagYou, this.mountLeftField, this.mountRightField)
            this.actorFlagYou = resultYou.actorFlag
            const resultDefense = this.createPlot(roundHistory, this.players.defense, this.actorFlagDefense, this.mountRightField, this.mountLeftField)
            this.actorFlagDefense = resultDefense.actorFlag
            // console.log(this.mountLeftField, this.mountRightField)
            console.log(`\n--------------------------------------\n`)

            // Object.assign(skillsList, resultYou.skillsList, resultDefense.skillsList)
            // statesList = statesList.concat(resultYou.statesList, resultDefense.statesList)
            this.plot.push(roundHistory)
        }

        if (this.round >= this.maxRound || Object.keys(this.mountRightField).length > 0) {
            this.resultFight = 'Thất Bại'
        } else if (Object.keys(this.mountLeftField).length == 0 && Object.keys(this.mountRightField).length == 0) {
            this.resultFight = 'Hòa'
        }

        return {
            resultFight: this.resultFight,
            skillsList: this.skillsList,
            statesList: this.statesList,
            plot: this.plot,
            mountLeftField: this.mountLeftField,
            mountRightField: this.mountRightField,
        }
    }

    createPlot(roundHistory, who, actorFlag, mainImmortalitiesObject, enemyImmortalitiesObject) {
        const whoAmI = (who < 0 ? 'you' : 'defense')
        const findActorResult = this.findActor(mainImmortalitiesObject, undefined, actorFlag)
        const indexActor = findActorResult.indexActor
        actorFlag = findActorResult.actorFlag
        // find row of actor
        const rowOfActor = this.findRowOfActor(indexActor)

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
                    actorImmortality.currentStatus[type] -= -(value)

                    operateEveryRoundStates[key].timeline -= 1
                    if (operateEveryRoundStates[key].timeline <= 0) {
                        const effect = {
                            type: 'remove',
                            name: key,
                        }
                        effectPreStatus.push(effect)
                        delete operateEveryRoundStates[key]
                    }
                    console.log('KQ: ', actorImmortality.currentStatus[type])

                    effectPreStatus.push(effect)
                })
            }
            // pointer to mainImmortalitiesObject[indexActor].toKeepStatesAlive
            const toKeepStatesAlive = actorImmortality?.toKeepStatesAlive || undefined
            if (toKeepStatesAlive &&
                Object.keys(mainImmortalitiesObject).length > 0 &&
                Object.keys(enemyImmortalitiesObject).length > 0
            ) {
                const currentStatus = {}
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
                    } else {
                        // -20 => -(-(-20)) = +20, recover status (computed status)
                        const type = toKeepStatesAlive[key].property.type
                        if (!currentStatus[type]) {
                            currentStatus[type] = actorImmortality.status[type]
                        }
                        currentStatus[type] -= -toKeepStatesAlive[key].property.value
                    }
                })

                Object.assign(actorImmortality.currentStatus, currentStatus)
                console.log(whoAmI, ' ', actorImmortality.currentStatus)
            }

            roundHistory[whoAmI].effects = roundHistory[whoAmI].effects.concat(effectPreStatus)

            // Choose skill
            const skillKeys = Object.keys(actorImmortality.skills)
            // console.log(skillIndex)
            const skillKey = this.findSkill(actorImmortality, skillKeys)
            this.skillsList[skillKey] = actorImmortality.skills[skillKey]

            // pointer to floor
            const floor = actorImmortality.skills[skillKey].floor
            const consume = floor.consume
            // computed consume of skill
            consume.forEach(fee => {
                const result = actorImmortality.currentStatus[fee.type] - (-fee.value)
                if (result < 0) {
                    actorImmortality.currentStatus[fee.type] = 0
                }

                actorImmortality.currentStatus[fee.type] = result
            })

            // pointer to activities
            const activities = floor.activities
            for (const activity of activities) {
                if (
                    Object.keys(mainImmortalitiesObject).length == 0 &&
                    Object.keys(enemyImmortalitiesObject).length == 0
                ) { break }
                const typeEffect = this.findTypeEffect(activity.property.value)

                const targetOfActivitiesObject = 
                    (this.whos[activity.who] < 0) ? enemyImmortalitiesObject : mainImmortalitiesObject
                // console.log(targetOfActivitiesObject)
                // console.log(activity.statesBonus)

                const effect = {
                    type: `skill-${activity.property.type}`,
                    name: activity.effects.mainEffect.name,
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
                                    this.handleComputedDamage(who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                    if (mainImmortalitiesObject[indexActor] && immortality) {
                                        const mainImmortality = mainImmortalitiesObject[indexActor]

                                        this.addState(mainImmortality, immortality, activity.operateEveryRoundStates, effectAfterSkill)
                                        this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                    }
                                })
                                break
                            default: // col, row, single
                                const locationOfTarget = this.findTarget(
                                                    rowOfActor, this.typeOfActivities[activity.typeOfActivity], targetOfActivitiesObject)
                                if (locationOfTarget.col != -1) {
                                    const vectorArguments = this.typeOfTargets[activity.typeOfTarget]
                                    
                                    if (vectorArguments.x > 0) {
                                        locationOfTarget.col = this.field.length - 1
                                        for(locationOfTarget.col; locationOfTarget.col > 0; locationOfTarget.col --) {
                                            // console.log(`Attack ${locationOfTarget.row} ${locationOfTarget.col}`)
                                            const index = this.field[locationOfTarget.col][locationOfTarget.row]
                                            const targetImmortality = targetOfActivitiesObject[ index ]
                                            this.handleComputedDamage(who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                            if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                                const mainImmortality = mainImmortalitiesObject[indexActor]

                                                this.addState(mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                                this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                            }
                                        }
                                        // erase element have hp <= 0
                                        this.handleDeleteElementOfArray(targetOfActivitiesObject, targetOfActivitiesObject)
                                    }
                                    if (vectorArguments.y > 0) {
                                        locationOfTarget.row = this.field[0].length - 1
                                        for(locationOfTarget.row; locationOfTarget.row > 0; locationOfTarget.row --) {
                                            const index = field[locationOfTarget.col][locationOfTarget.row]
                                            const targetImmortality = targetOfActivitiesObject[ index ]
                                            this.handleComputedDamage(who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                            if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                                const mainImmortality = mainImmortalitiesObject[indexActor]

                                                this.addState(mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                                this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                            }
                                        }
                                    }

                                    // Case element be effected first
                                    const index = this.field[locationOfTarget.col][locationOfTarget.row]
                                    const targetImmortality = targetOfActivitiesObject[index]
                                    this.handleComputedDamage(who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                    if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                        const mainImmortality = mainImmortalitiesObject[indexActor]

                                        this.addState(mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                        this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
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
                                    this.handleComputedDamage(who, immortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                    if (mainImmortalitiesObject[indexActor] && immortality) {
                                        const mainImmortality = mainImmortalitiesObject[indexActor]

                                        this.addState(mainImmortality, immortality, activity.operateEveryRoundStates, effectAfterSkill)
                                        this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
                                    }
                                })
                                break
                            case 'single': // single - you => this immortality's activity
                                const targetImmortality = targetOfActivitiesObject[indexActor]
                                this.handleComputedDamage(who, targetImmortality, targetOfActivitiesObject, effect, typeEffect, activity)

                                if (mainImmortalitiesObject[indexActor] && targetImmortality) {
                                    const mainImmortality = mainImmortalitiesObject[indexActor]

                                    this.addState(mainImmortality, targetImmortality, activity.operateEveryRoundStates, effectAfterSkill)
                                    this.addKeepStateAlive(who, mainImmortality, mainImmortalitiesObject, targetImmortality, targetOfActivitiesObject, activity.toKeepStatesAlive, effectAfterSkill)
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
            }
            
            // console.log('mainImmortalitiesObject: ', mainImmortalitiesObject, '\n########\n')
            // console.log('enemyImmortalitiesObject: ', enemyImmortalitiesObject, '\n########\n')
        }

        return { roundHistory, mainImmortalitiesObject, actorFlag }
    }

    findActor(immortalities, indexActor, actorFlag) {
        for(let col = 0; col < this.field.length; col++) {
            for(let row = 0; row < this.field[col].length; row++) {
                const index = this.field[col][row]
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
            return this.findActor(immortalities, indexActor, !actorFlag)
        }

        return { indexActor, actorFlag }
    }

    findRowOfActor(actor) {
        let rowOfActor = -1
        this.field.forEach(col => {
            for(let row = 0; row < col.length; row ++) {
                if (col[row] == actor) rowOfActor = row
            }
        })

        return rowOfActor
    }

    findTarget(rowOfActor, typeOfActivity, mountFieldTarget) {
        const _this = this
        for(let row = rowOfActor; row >= 0; row --) {
            for(let col = typeOfActivity.col; stopCondition(typeOfActivity, col); col = computedColumn(typeOfActivity, col)) {
                if (mountFieldTarget[this.field[col][row]]) {
                    return { col, row }
                }
            }
        }

        for(let row = rowOfActor; row < this.field[0].length; row ++) {
            for(let col = typeOfActivity.col; stopCondition(typeOfActivity, col); col = computedColumn(typeOfActivity, col)) {
                if (mountFieldTarget[this.field[col][row]]) {
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
            return (typeOfActivity.col == 0 && col < _this.field.length) 
                    || (typeOfActivity.col == 2 && col >= 0)
        }
    }

    findTypeEffect(valueProperty) {
        if (valueProperty >= 0) return 'heals';
        return 'damages'
    }

    findSkill(actorImmortality, skillKeys) {
        // filter skills can active
        const newSkillKeys = skillKeys.filter(key => {
            const floor = actorImmortality.skills[key].floor
            const consume = floor.consume
            // computed consume of skill
            for(let fee of consume) {
                const result = actorImmortality.currentStatus[fee.type] - (-fee.value)
                if (result < 0) return false
            }
            return true
        })
        const skillIndex = Math.floor(Math.random() * newSkillKeys.length)

        return newSkillKeys[skillIndex]
    }

    handleComputedDamage(who, targetImmortalityObject, targetImmortalitiesObject, effect, typeEffect, activity) {
        if (targetImmortalityObject) {
            // console.log('-- name: ', activity.who, ' ', targetImmortalityObject.currentStatus.HP, 'type: ', activity.property.type)
            targetImmortalityObject.currentStatus[activity.property.type] -= (-activity.property.value)

            // console.log('---- index: ', targetImmortalityObject.index, ', who: ', who, ', activityWho: ', this.whos[activity.who], ', kq: ', targetImmortalityObject.index * who * this.whos[activity.who])
            effect.objects.push(targetImmortalityObject.index * who * this.whos[activity.who])
            effect[typeEffect].push(activity.property.value)

            if (targetImmortalityObject.currentStatus.HP <= 0) {
                delete targetImmortalitiesObject[targetImmortalityObject.index]
            }
        }

    }

    handleComputedDamageFromKeepStateAlive(who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state) {
        if (targetImmortalityObject) {
            const actionEffect = {
                type: 'action',
                name: state.effect.name,
                objects: [targetImmortalityObject.index * who * this.whos[state.who]],
            }
            effectStates.push(actionEffect)
            const effect = {
                type: typeEffect.substring(0, typeEffect.length - 1),
                objects: [],
                [typeEffect]: []
            }
            
            targetImmortalityObject.currentStatus[state.property.type] -= (-state.property.value)

            if (targetImmortalityObject.currentStatus[state.property.type] < 0) {
                targetImmortalityObject.currentStatus[state.property.type] = 0
            }

            effect.objects.push(targetImmortalityObject.index * who * this.whos[state.who])
            effect[typeEffect].push(state.property.value)
            effectStates.push(effect)

            if (targetImmortalityObject.currentStatus.HP <= 0) {
                delete targetImmortalitiesObject[targetImmortalityObject.index]
            }
        }
    }

    addState(who, mainImmortality, targetImmortality, operateEveryRoundStates, effectStates) { // other: thisImmortality, immortalities same same field
        const statesOfMainImmortality = mainImmortality.operateEveryRoundStates
        const statesOfTargetImmortality = targetImmortality.operateEveryRoundStates

        operateEveryRoundStates.forEach(state => {
            this.statesList.push(new Object(state.effect))
            const actionEffect = {
                type: 'action',
                name: state.effect.name,
                objects: [],
            }
            if (this.whos[state.who] < 0) { // enemy
                if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfTargetImmortality[state.effect.name] = state
                    actionEffect.objects.push(targetImmortality.index * who * this.whos[state.who])
                }
            } else if (this.whos[state.who] > 0) { //you
                if ( ! statesOfMainImmortality[state.effect.name] || statesOfMainImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfMainImmortality[state.effect.name] = state
                    actionEffect.objects.push(mainImmortality.index * who * this.whos[state.who])
                }
            } else if (this.whos[state.who] == 0) { // other from your field
                if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfTargetImmortality[state.effect.name] = state
                    actionEffect.objects.push(targetImmortality.index * who * this.whos[state.who])
                }
            }
            effectStates.push(actionEffect)
        })
    }

    addKeepStateAlive(who, mainImmortalityObject, mainImmortalitiesObject, targetImmortalityObject, targetImmortalitiesObject, operateEveryRoundStates, effectStates) { // other: thisImmortality, immortalities same same field
        const statesOfMainImmortality = mainImmortalityObject.toKeepStatesAlive
        const statesOfTargetImmortality = targetImmortalityObject.toKeepStatesAlive

        operateEveryRoundStates.forEach(state => {
            this.statesList.push(new Object(state.effect))
            const typeEffect = this.findTypeEffect(state.property.value)
            if (this.whos[state.who] < 0) { // enemy
                if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfTargetImmortality[state.effect.name] = state

                    this.handleComputedDamageFromKeepStateAlive(who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state)
                }
            } else if (this.whos[state.who] > 0) { //you
                if ( ! statesOfMainImmortality[state.effect.name] || statesOfMainImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfMainImmortality[state.effect.name] = state

                    this.handleComputedDamageFromKeepStateAlive(who, mainImmortalityObject, mainImmortalitiesObject, effectStates, typeEffect, state)
                }
            } else if (this.whos[state.who] == 0) { // other from your field
                if ( ! statesOfTargetImmortality[state.effect.name] || statesOfTargetImmortality[state.effect.name].timeline < state.timeline) {
                    statesOfTargetImmortality[state.effect.name] = state

                    this.handleComputedDamageFromKeepStateAlive(who, targetImmortalityObject, targetImmortalitiesObject, effectStates, typeEffect, state)
                }
            }
        })
    }
}

module.exports = Fight
