const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Effect = require('../models/Effect')
const Figure = require('../models/Figure')

const Animation = new Schema({
    sky: { type: String, default: '', },  // image
    figure: { type: ObjectId, ref: 'Figure' }, // image
    mainEffect: { type: ObjectId, ref: 'Effect' }, // effect
    delay: { type: Number, default: 1000, },
})

module.exports = Animation
