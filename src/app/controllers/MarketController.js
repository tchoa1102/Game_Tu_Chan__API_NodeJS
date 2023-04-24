const { Market, Item, Equipment, Skill, User, } = require('../models')

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

    // [PATCH] /api/markets/buy
    async buy(req, res, next) {
        try {
            const data = req.body
            const idItem = data.idItem
            const idUser = data.idUser
            const user = await User.findById(idUser)
            const item = await Market.findById(idItem)
            
            if (item.quantity <= 0) {
                return res.json({ message: 'Sản Phẩm Đã Hết' })
            }

            let isEnough = true
            item.prices.items.forEach(i => {
                for(let e of user.bag.items) {
                    if (e != -1) {
                        if (e.item == i.data && e.quantity >= i.quantity) {
                            e.quantity -= i.quantity
                            if (e.quantity <= 0) {
                                e = -1
                            }
                            break
                        } else {
                            isEnough = false 
                        }
                    }
                }
            })

            if (isEnough) {
                item.prices.equips.forEach(i => {
                    for(let e of user.bag.equipments) {
                        if (e != -1) {
                            if (e.item == i.data) {
                                e.quantity -= i.quantity
                                if (e.quantity <= 0) {
                                    e = -1
                                }
                                break
                            } else {
                                isEnough = false 
                            }
                        }
                    }
                })
            }

            if (isEnough) {
                item.prices.skills.forEach(i => {
                    for(let e of user.bag.skills) {
                        if (e != -1) {
                            if (e.item == i.data) {
                                e.quantity -= i.quantity
                                if (e.quantity <= 0) {
                                    e = -1
                                }
                                break
                            } else {
                                isEnough = false 
                            }
                        }
                    }
                })
            }

            if (isEnough) {
                item.quantity -= 1

                await User.updateOne({ _id: user._id }, { bag: user.bag })
                await item.save()
                return res.json({ message: 'Thành Công' })
            }
            return res.json({ message: 'Không Đủ Yêu Cầu' })
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = new MarketController
