module.exports = {
    mergeObject(target, source) {
        target.name = source.name
        target.id = source.id
        target._id = source._id
        target.birth = source.birth
        target.role = source.role
        target.image = source.image
        target.follows = source.follows
        return target
    },
}
