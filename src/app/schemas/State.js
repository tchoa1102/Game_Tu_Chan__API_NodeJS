const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Property = require('./Property')

const State = new Schema({
    who: { type: String, default: 'you', },
    name: { type: String, },
    effect: { type: String, },
    style: { type: String, },
    animation: { type: String, },
    property: { type: Property, default: () => ({}),},
    timeline: { type: Number, }, // số lượt tồn tại
})

module.exports = State
