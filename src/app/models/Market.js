const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId
const newObjectId = mongoose.Types.ObjectId

const Market = new Schema({
    item: { type: ObjectId, ref: 'Item' },
    equipment: { type: ObjectId, ref: 'Equipment' },
    skill: { type: ObjectId, ref: 'Skill' },
    type: { type: String, default: 'equipment'},
    quantity: { type: Number, default: 1, },
    prices: {
        items: [{
            data: { type: ObjectId, ref: 'Item', default: newObjectId('64002ada2f93ddad6483a848'), },
            type: { type: String, default: 'item', },
            quantity: { type: Number, default: 1, },
        }],
        equips: [{
            data: { type: ObjectId, ref: 'Equipment', },
            type: { type: String, default: 'equipment', },
            quantity: { type: Number, default: 1, },
        }],
        skills: [{
            data: { type: ObjectId, ref: 'Skill', },
            type: { type: String, default: 'skill', },
            quantity: { type: Number, default: 1, },
        }],
    },
    isPost: { type: Boolean, default: false, },
})

module.exports = mongoose.model('Market', Market)
