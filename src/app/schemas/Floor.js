const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Effect = require('./Effect')
const State = require('./State')
const Property = require('./Property')

const Floor = new Schema({
    startIs: { type: String, required: true, },

    name: { type: String, required: true, unique: true },
    newLevel: { type: String, default: '' },
    trainedTime: { type: Number, default: 0},

    consume: { type: Array, default: [] }, // [{hp: }, {mp: }, ...]
    requirements: { type: Array, default: [], }, // required resources to train
    costs: { type: Array, default: [], }, // Phí mua

    typeOfActivity: { type: Array, default: [], },

    effects: { type: Effect, default: () => ({})},

    states: [State],

    property: { type: Property, default: () => ({}),},
})

module.exports = Floor
