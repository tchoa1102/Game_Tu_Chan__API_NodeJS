const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Immortality = require('../models/Immortality')
const Item = require('../models/Item')
const Equipment = require('../models/Equipment')

const Cluster = new Schema({
    name: String,
    front: String,
    immortalities: [{
        type: ObjectId,
        ref: 'Immortality',
    }],
    awards: {
        items: [{
            type: ObjectId,
            ref: 'items',
        }],
        equipments: [{
            type: ObjectId,
            ref: 'equipments',
        }],
    },
})

module.exports = Cluster
