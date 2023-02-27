const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Floor = require('../schemas/Floor')

const Skill = new Schema({
    name: { type: String, required: true, },
    description: { type: String, default: '', },

    floors: [{ type: Floor, default: () => ({})}]
})

module.exports = mongoose.model('Skill', Skill)
