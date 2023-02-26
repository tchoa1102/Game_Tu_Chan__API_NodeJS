const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Figure = require('../models/Figure')

const Effect = new Schema({
    sky: { type: String, default: '', },  // image
    action: { type: String, default: '', }, // image
    figure: { type: ObjectId, ref: 'Figure' }, // image
})

module.exports = Effect
