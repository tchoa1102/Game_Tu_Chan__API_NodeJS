const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId
const newObjectId = mongoose.Types.ObjectId

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
        equipments: [{ // each a equipment is a element of array
            equip: {
                type: ObjectId,
                ref: 'Equipment',
            },
            wearIs: {
                type: ObjectId,
                ref: 'Immortality',
                default: newObjectId('000000000000000000000000'),
            },
            durability: { type: Number, required: true, default: 100, }, // <= 0 -> destroy
        }],
    },
    quests: { type: Object, }, // history excursion
    strategy: {
        type: ObjectId,
        ref: 'Setup.strategy',
    },
})

module.exports = mongoose.model('User', User)
