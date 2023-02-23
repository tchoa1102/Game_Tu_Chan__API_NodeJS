const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Figure = new Schema({
    name: { type: String, },
    effect: { type: String, }, // image
    style: { type: String, },
    animation: { type: String, },
})

module.exports = mongoose.model('Figure', Figure)
