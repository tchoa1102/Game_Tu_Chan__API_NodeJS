const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = mongoose.ObjectId

const Skill = require('./Skill')

const Immortality = new Schema({
    user: { type: ObjectId, default: undefined, },
    name: { type: String, },
    index: { type: Number, default: -1, },
    level: { type: Object, default: {
        name: 'Luyện Khí kì',
        level: 'Tầng 1',
    },},
    avatar: { type: String, default: 'monk' },

    currentStatus: { type: Object, default: {
        HP: { type: Number, default: 100, },
        MP: { type: Number, default: 100, },
    },},

    status: { type: Object, default: {
        HP: { type: Number, default: 100, },
        MP: { type: Number, default: 100, },

        ATK: { type: Number, default: 100, },
        INT: { type: Number, default: 100, }, // magic attack
        DEF: { type: Number, default: 100, }, // defense
        ACC: { type: Number, default: 1, }, // Accuracy, độ chính xác => cường độ thần thức
        AGI: { type: Number, default: 1, }, // Agility ~= Speed => thân pháp
    },},

    // equipments: {
    //     auxiliaries: [],
    //     attacks: [],
    // },
    skills: { type: Object, default: {}, },
    /**
     * "skill name": {
            floor: { type: String, }, // currently floor
            exp: { type: Number, } // how long have you been training? (s)
        }
     */
    trainingSkill: { type: String, default: '', }, // skill's name is training.
})

module.exports = mongoose.model('Immortality', Immortality)

/**
 * Công vật lí: (ATK + attack_base_of_sKill) * (ACC / AGI) - DEF
 * Công phép: (INT + attack_base_of_sKill) * (ACC / AGI) - DEF
 */
