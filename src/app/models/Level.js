const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Level = new Schema({
    name: String,
    levels: { type: Object, default: {} },
    /**
     * {
     *  "Tầng 1": {
     *      name: "Tầng 1",
     *      increase: 10,
     *   }
     * }
     */
    // increase: Number,
})

module.exports = mongoose.model('Level', Level)
