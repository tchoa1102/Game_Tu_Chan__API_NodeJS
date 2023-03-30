const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Item = new Schema({
    name: { type: String, },
    value: { type: String, },
    description: { type: String, },
})

module.exports = mongoose.model('Item', Item)
