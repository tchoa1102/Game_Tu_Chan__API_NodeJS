const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

// const Immortality = require('../models/Immortality')
// const Item = require('../models/Item')
// const Skill = require('../models/Skill')
// const Equipment = require('../models/Equipment')

const Cluster = new Schema({
    name: String,
    front: String,
    immortalities: [{
        type: ObjectId,
        ref: 'Immortality',
    }],
    awards: {
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
        }],
    },
})

module.exports = Cluster
