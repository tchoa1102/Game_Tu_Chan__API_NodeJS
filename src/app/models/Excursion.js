const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Excursion = new Schema({
    name: String,
    front: String,
    clusters: [{
        name: String,
        immortalities: [{
            ref: 'Immortality',
        }]
    }],
})

module.exports = mongoose.model('Excursion', Excursion)
