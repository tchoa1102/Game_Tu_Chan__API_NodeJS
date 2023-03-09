const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

// Schema register for model
const Item = require('./Item')
const Skill = require('./Skill')
const Equipment = require('./Equipment')

const User = new Schema({
    name: { type: String, },
    avatar: { type: String, },
    email: { type: String, },
    level: { type: String, },
    spiritStone: { type: Number, },
    bag: {
        items: [{
            item: {
                type: ObjectId,
                ref: 'Item',
            },
            quantity: Number
        }],
        skills: [{
            skill: {
                type: ObjectId,
                ref: 'Skill',
            },
            quantity: Number,
            trainings: {}
        }],
        equipments: [{
            equip: {
                type: ObjectId,
                ref: 'Equipment',
            },
            quantity: Number,
            wears: {}
        }],
    },
    quests: { type: Object, } // history excursion
})

module.exports = mongoose.model('User', User)
