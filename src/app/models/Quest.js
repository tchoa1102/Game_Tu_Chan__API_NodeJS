const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Cluster = require('../schemas/Cluster')

const Quest = new Schema({
    name: String,
    front: String, // *(Quest front) -> Quest front of Quest, null => first.
    clusters: [{type: Cluster}],
})

module.exports = mongoose.model('Quest', Quest)
