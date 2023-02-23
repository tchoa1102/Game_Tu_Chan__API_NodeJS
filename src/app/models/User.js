const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    name: { type: String, },
    level: { type: String, },
    spiritStone: { type: Number, },
    bag: {
        items: [{
            ref: 'Item',
        }],
        equipments: [{
            ref: 'Equipment',
        }],
    }
})

module.exports = mongoose.model('User', User)
