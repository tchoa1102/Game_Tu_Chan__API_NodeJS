const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Item = new Schema({
    name: { type: String, },
    value: { type: String, },
    image: { type: String, default: '1425L7mkY3EJM4v636JW8istQLTlVxy2q' },
    description: { type: String, },
})

module.exports = mongoose.model('Item', Item)
