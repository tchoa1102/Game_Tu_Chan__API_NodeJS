const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Setup = new Schema({
    levels: { type: Array, default: [], unique: true },
    typeOfActivity: { type: Object, default: {} },
    typeOfTarget: { type: Object, default: {} },
    field: { type: Array, default: [], },
    whos: { type: Object, default: {}, },
    startIs: { type: Object, default: {}, },
    players: { type: Object, default: {}, },
    locationSkill: { type: Object, default: {}, },
    immortalitiesName: { type: Array, default: [] },
})

module.exports = mongoose.model('Setup', Setup)
