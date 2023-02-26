const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Skill = require('./Skill')

const Immortality = new Schema({
    name: { type: String, },
    index: { type: Number, },
    level: { type: String, },
    avatar: { type: String, },

    hp: { type: Number, default: 100, },
    mp: { type: Number, default: 100, },
    currentlyHP: { type: Number, default: 100, },
    currentlyMP: { type: Number, default: 100, },

    ATK: { type: Number, default: 100, },
    INT: { type: Number, default: 100, }, // magic attack
    DEF: { type: Number, default: 100, }, // defense
    ACC: { type: Number, default: 1, }, // Accuracy, độ chính xác => cường độ thần thức
    AGI: { type: Number, default: 1, }, // Agility ~= Speed => thân pháp

    equipments: {
        auxiliaries: [],
        attacks: [],
    },

    skills: { type: Object, }
    /**
     * "skill name": {
            ref: 'Skill',
            floor: { type: String, }, // currently floor
            exp: { type: Number, } // how long have you been training? (%)
        }
     */
})

module.exports = mongoose.model('immortality', Immortality)

/**
 * Công vật lí: (ATK + attack_base_of_sKill) * (ACC / AGI) - DEF
 * Công phép: (INT + attack_base_of_sKill) * (ACC / AGI) - DEF
 */
