const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Figure = require('../models/Figure')

const Effect = new Schema({
    sky: { type: String, default: '', },  // image
    figure: { type: ObjectId, ref: 'Figure' }, // image
    action: { type: String, default: '1NKVTk1G0LXMbj_X17OLiYc_q6EaNVxdk', }, // image
    style: { type: String, default: '', },
    animation: { type: String, default: '', },
    delay: { type: Number, default: 1000, },
})

module.exports = Effect
