const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Effect = require('../models/Effect')
const Property = require('./Property')

const State = new Schema({
    who: { type: String, default: 'you', }, // you / enemy (to every immortality is effected)
    timeline: { type: Number, default: 100, }, // số lượt tồn tại, > 31 => oo => add base status

    name: { type: String, },
    effect: { type: ObjectId, ref: 'Effect'},

    property: { type: Property, default: () => ({}),},
})

module.exports = State
