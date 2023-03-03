const Immortality = require('../models/Immortality')

class ImmortalityController {
    // [POST] /api/users/:id/immortalities/create
    async create(req, res, next) {
        const data = req.body

        try {
            const immortality = new Immortality(data)
            const result = await immortality.save()

            return res.json(result)
        } catch (error) {
            next(error)
        }
    }

    // [GET] /api/users/:id/immortalities
    async getImmortalities(req, res, next) {
        const id = req.params.id

        try {
            const result = await Immortality.find({user: id})
            console.log(result)
            return res.json(result)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new ImmortalityController
