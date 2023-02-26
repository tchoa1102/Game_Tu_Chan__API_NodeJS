const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Floor = require('../schemas/Floor')

const Skill = new Schema({
    name: { type: String, required: true, },
    style: { type: String, default: '', },
    animation: { type: String, default: '', },
    delay: { type: Number, default: 1000, },
    requirements: { type: Array, default: [], },

    floors: [{ type: Floor, default: () => ({})}]
})

module.exports = mongoose.model('Skill', Skill)
