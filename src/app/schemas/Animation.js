const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const { Figure, Effect, } = require('../models/index')

const Animation = new Schema({
    sky: { type: String, default: '', },  // image
    figure: { type: ObjectId, ref: 'Figure' }, // image
    effect: { type: ObjectId, ref: 'Effect' }, // effect
    delay: { type: Number, default: 1000, },
})

module.exports = Animation
