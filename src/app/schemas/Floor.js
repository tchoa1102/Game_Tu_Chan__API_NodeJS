const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Effect = require('./Effect')
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
        typeOfTarget: { type: String, default: 'single', }, // row? col? ...
        typeOfActivity: { type: String, default: 'first', }, // first / middle / last
        property: { type: Property, default: () => ({}),}, // property for the skills
    }],

    effects: { type: Effect, default: () => ({})},

    states: [State], // properties for the states when fight

})

module.exports = Floor
