const Immortality = require('../models/Immortality')

class ImmortalityController {
    // [POST] /users/:id/immortalities/create
    async create(req, res, next) {
        const data = req.body

        try {
            const immortality = new Immortality(data)
            const result = await immortality.save()

            return res.json(result)
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'ERROR!!!'
            })
        }
    }
}

module.exports = new ImmortalityController
