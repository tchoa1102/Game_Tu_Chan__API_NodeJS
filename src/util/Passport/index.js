module.exports = {
    mergeObject(target, source) {
        target.name = source.name
        target.id = source.id
        target._id = source._id
        target.role = source.role
        target.avatar = source.avatar
        return target
    },
}
