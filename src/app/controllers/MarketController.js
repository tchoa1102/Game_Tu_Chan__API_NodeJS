const { Market, Item, Equipment, Skill, } = require('../models')

class MarketController {
    // [GET] /api/markets
    async getAll(req, res, next) {
        try {
            const market = await Market.find({ isPost: true })
                .populate({ path: 'item' })
                .populate({ path: 'equipment' })
                .populate({ path: 'skill' })
                .populate({ path: 'prices.items.data' })
                .populate({ path: 'prices.equips.data' })
                .populate({ path: 'prices.skills.data' })

            return res.json(market)
        } catch (error) {
            return next(error)
        }
    }

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
