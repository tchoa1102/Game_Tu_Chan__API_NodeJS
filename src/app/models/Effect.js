const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Effect = new Schema({
    name: { type: String, default: '' },
    action: { type: String, default: '1NKVTk1G0LXMbj_X17OLiYc_q6EaNVxdk', }, // image
    style: { type: String, default: '', },
    animation: { type: String, default: '', },
    image: { type: String, default: '1-4lQCe52JJ0UHxzkzkIB6BWAGYTJmJu1' },
    startIs: { type: String, default: 'you', required: true, } // you/object
})

module.exports = mongoose.model('Effect', Effect)
