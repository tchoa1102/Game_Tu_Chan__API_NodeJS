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
    quests: { type: Object, default: {
        'Ngọa Long Sơn': {
            current: {},
            next: {
                'Thảo Khấu 1': 'Thảo Khấu 1',
            },
            isNext: false,
        }
    },}, // history excursion
    /**
     * quest: {
     *  <clusters's Name>: {
     *      current: { <cluster's name>: <cluster's name>, ... },
     *      next: { <cluster's name>: <cluster's name>, ... },
     *      isNext: true/false,
     *  },
     *  ...
     * }
     */
    strategy: {
        1: { type: String, default: '', },
        2: { type: String, default: '', },
        3: { type: String, default: '', },
        4: { type: String, default: '', },
        5: { type: String, default: '', },
        6: { type: String, default: '', },
        7: { type: String, default: '', },
        8: { type: String, default: '', },
        9: { type: String, default: '', },
    },
    showMarket: [{
        marksItem: { type: ObjectId, ref: 'Market', },
        isShow: { type: Boolean, default: true, },
    },],
})

module.exports = mongoose.model('User', User)
