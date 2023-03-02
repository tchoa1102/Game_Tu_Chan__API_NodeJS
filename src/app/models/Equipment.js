const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Property = require('../schemas/Property')

const Equipment = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, default: 'auxiliary' },
    property: { type: Property, default:(() => {}) },
    level: { type: Number, required: true, default: 0 },
    requiredLevel: { type: String, required: true, default: 'Luyện Khí tầng 1'},
    durability: { type: Number, required: true, default: 100, }, // 
})

module.exports = mongoose.model('Equipment', Equipment)
