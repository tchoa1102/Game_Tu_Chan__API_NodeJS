const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Property = require('../schemas/Property')

const Equipment = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, default: 'auxiliary' },
    // weapon (sword / stick / ... to attack) / auxiliary
    property: { type: Property, default:(() => {}) },
    level: { type: Object, required: true, default: {name: 'Luyện Khí Kì', level: 'Tầng 1'} },
    requiredLevel: { type: Object, required: true, default: {name: 'Luyện Khí Kì', level: 'Tầng 1'}},
})
/**
 * type: tấn công? (chỉ được 1 món) phụ trợ? (được nhiều món)
 */

module.exports = mongoose.model('Equipment', Equipment)
