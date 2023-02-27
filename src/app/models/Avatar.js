const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Avatar = new Schema({
    name: { type: String, required: true, unique: true },
    effects: { type: Object, default: {} },
    /**
     * {
     *  normal: idImage,
     *  chanting: {
     *      effect: idImage,
     *      animation: '',
     *  },
     *  chantingFinish: {
     *      effect: idImage,
     *      animation: '',
     *  },
     *  "trảm": {
     *      effect: idImage,
     *      animation: '',
     *  },
     *  "giơ tay lên cao": {
     *      effect: idImage,
     *      animation: '',
     *  },
     *  ...
     * }
     */
})

module.exports = mongoose.model('Avatar', Avatar)
