const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Property = new Schema({
    type: { type: String, },
    indicator: { type: Number, default: 0, },
})

module.exports = Property
