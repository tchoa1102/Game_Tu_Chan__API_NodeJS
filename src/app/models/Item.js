const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Item = new Schema({
    name: { type: String, },
    indicator: { type: Number, },
    quantity: { type: Number, },
})

module.exports = mongoose.model('Item', Item)
