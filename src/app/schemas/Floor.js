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
    
    startIs: { type: String, required: true, },
    typeOfChant: { type: String, default: 'chanting', },
    consume: { type: Array, default: [] }, // [{hp: }, {mp: }, ...]
    activities: [{
        who: { type: String, default: 'enemy' }, // you / enemy
        typeOfTarget: { type: String, default: 'single', }, // row? col? ...
        typeOfActivity: { type: String, default: 'first', }, // first / middle / last
        property: { type: Property, default: () => ({}),}, // property for the skills

        effects: { type: Animation, default: () => ({})},
        statesBonus: { type: Array, default: [State]},
        effect: { type: ObjectId, ref: 'Effect' },
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
 * { -> heal of states
 *  "who": "you",
 *  "timeline": 3,
 *  "name": "heal",
 *  "effect": "1NKVTk1G0LXMbj_X17OLiYc_q6EaNVxdk",
 *  "style": "",
 *  "animation": "",
 *  "property": {
 *      "type": "heal",
 *      "value": 50
 *  },
 * }
 */

module.exports = Floor
