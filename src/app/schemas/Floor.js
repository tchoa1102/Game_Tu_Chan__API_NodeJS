const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Animation = require('./Animation')
const State = require('./State')
const Property = require('./Property')

const Floor = new Schema({
    name: { type: String, required: true, unique: true },
    costs: { type: Array, default: [], }, // Phí mua
    
    newLevel: { type: Object, default: {} }, // {name: '', level: ''}
    trainedTime: { type: Number, default: 0},
    requirements: { type: Array, default: [], }, // required resources to train
    
    typeOfChant: { type: String, default: 'chanting', },
    consume: { type: Array, default: [] }, // [{hp: }, {mp: }, ...]
    activities: [{
        who: { type: String, default: 'enemy' }, // you / enemy
        type: { type: String, default: 'INT' }, // công vật lý hay công phép?
        typeOfTarget: { type: String, default: 'single', }, // row? col? ...
        typeOfActivity: { type: String, default: 'first', }, // first / middle / last
        property: { type: Property, default: () => ({}),}, // property for the skills

        effects: { type: Animation }, // effect skill vd flame, heal
        operateEveryRoundStates: [State],
        toKeepStatesAlive: [State],
    }],

    // states: [State], // properties for the states when passive
    statusBonus: { type: Array, default: [Property] },
})

/**
 *
 * { -> activity, not is states
 *  "who": "you",
 *  typeOfTarget: { type: String, default: 'single', }, // row? col? ...
 *  typeOfActivity: { type: String, default: 'first', }, // first / middle / last
 *  "property": {
 *      "type": "heal",
 *      "value": 50
 *  },
 * }
 * 
 * { property.value > 0 -> heal of states
 *  "who": "you",
 *  "timeline": 3,
 *  "effect": "1NKVTk1G0LXMbj_X17OLiYc_q6EaNVxdk",
 *  "style": "",
 *  "animation": "",
 *  "property": {
 *      "type": "HP",
 *      "value": 50
 *  },
 * }
 */

module.exports = Floor
