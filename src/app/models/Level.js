const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Level = new Schema({
    name: String,
    increase: Number,
})

module.exports = mongoose.model('Level', Level)
