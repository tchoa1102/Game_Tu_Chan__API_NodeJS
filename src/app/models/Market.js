const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Market = new Schema({
    yield: { type: ObjectId, required: true, unique: true, },
    type: { type: String, required: true, default: 'Equipment'},
    quantity: { type: Number, default: 1, },
    prices: { type: Object, default: {
        '64002ada2f93ddad6483a848': {
            id: '64002ada2f93ddad6483a848',
            type: 'Item',
            quantity: 1,
        }
    }, },
})

module.exports = mongoose.model('Market', Market)
