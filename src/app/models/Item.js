const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Item = new Schema({
    name: { type: String, },
    value: { type: Number, },
    quantity: { type: Number, },
    description: { type: String, },
})

module.exports = mongoose.model('Item', Item)
