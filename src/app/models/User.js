const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    name: { type: String, },
    level: { type: String, },
    spiritStone: { type: Number, },
    bag: {
        items: [{
            ref: 'Item',
            quantity: Number
        }],
        skills: [{
            ref: 'Skill',
            quantity: Number,
            trainings: {}
        }],
        equipments: [{
            ref: 'Equipment',
            quantity: Number,
            wears: {}
        }],
    },
    excursions: { type: Object, } // history excursion
})

module.exports = mongoose.model('User', User)
