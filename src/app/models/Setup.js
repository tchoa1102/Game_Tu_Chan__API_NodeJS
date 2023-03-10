const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Setup = new Schema({
    levels: { type: Array, default: [], unique: true },
})

module.exports = mongoose.model('Setup', Setup)
