const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Property = new Schema({
    type: { type: String, },
    value: { type: Number, default: 0, },
})
/** property:
 * type: Công vật lí (ATK), Phòng thủ (DEF), Công phép (INT), Máu tối đa (HP), Linh lực tối đa (MP), 
 * ACC (Cường độ thần thức), AGI (Thân pháp)
 * 
 * trong đó:
 *  damage (-), heal(+)
 *  ATK, INT, DEF, HP, MP, ACC, AGI -> keep round alive (one action)
 *  bị động: máu tối đa, mana tối đa, phòng thủ, damage, heal,
 *  bị động: công vật lí, công phép (if it's equipment's property, this row is increased to status of immortality)
 * 
 * if it's equipment's property, it's auto passive
*/

module.exports = Property
