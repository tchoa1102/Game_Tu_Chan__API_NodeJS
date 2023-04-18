const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Immortality = require('../models/Immortality')
const Item = require('../models/Item')
const Skill = require('../models/Skill')
const Equipment = require('../models/Equipment')

const Cluster = new Schema({
    name: String,
    front: String,
    image: { type: String, default: '1A1s6d1GPoz9Yj7R63aS1ZoPDkYQvr6PC' },
    location: { type: Object, default: {
        top: '50%',
        left: '50%',
    }},
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
            quantity: Number,
            rate: String,
        }],
        skills: [{
            skill: {
                type: ObjectId,
                ref: 'Skill',
            },
            quantity: Number,
            rate: String,
        }],
        equipments: [{
            equip: {
                type: ObjectId,
                ref: 'Equipment',
            },
            quantity: Number,
            rate: String,
        }],
    },
})

module.exports = Cluster
