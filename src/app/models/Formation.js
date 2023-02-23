const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Formation = new Schema({
    name: { type: String, },
    locations: { type: Array, },
    property: { type: Object, default: {
        type: { type: String, },
        indicator: { type: Number, },
    }},
})

module.exports = mongoose.model('Formation', Formation)
