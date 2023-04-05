const { Market, } = require('../models')

class MarketController {
    // [GET] /api/markets/:yield
    async get(req, res, next) {}

    // [POST] /api/markets
    async create(req, res, next) {
        try {
            const body = req.body
            // prices received is array
            body.prices = body.prices.reduce((total, price) => {
                total[price._id] = new Object(price)
                return total
            }, {})

            const newItem = new Market(body)
            await newItem.save()

            return res.json({ 
                message: 'Thành Công',
                data: newItem
            })
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = new MarketController
