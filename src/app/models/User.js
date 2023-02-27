const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const User = new Schema({
    name: { type: String, },
    email: { type: String, },
    level: { type: String, },
    spiritStone: { type: Number, },
    bag: {
        items: [{
            type: ObjectId,
            ref: 'Item',
            quantity: Number
        }],
        skills: [{
            type: ObjectId,
            ref: 'Skill',
            quantity: Number,
            trainings: {}
        }],
        equipments: [{
            type: ObjectId,
            ref: 'Equipment',
            quantity: Number,
            wears: {}
        }],
    },
    excursions: { type: Object, } // history excursion
})

module.exports = mongoose.model('User', User)
