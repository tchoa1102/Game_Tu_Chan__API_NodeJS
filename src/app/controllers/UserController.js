const { User, } = require('../models')

class UserController {
    // [GET] /api/users/whoami
    async get(req, res, next) {
        console.log("\n\n\nGet user...")
        try {
            // console.log("Auth", req.session.passport.user.emails)
            if (req.session.passport?.user) {
                console.log('json')
                let user = await User.findOne({ _id: req.session.passport.user._id }).populate({
                    path: 'bag.items',
                    populate: {
                        path: 'item',
                    }
                }).populate(
                    {
                        path: 'bag.skills',
                        populate: {
                            path: 'skill'
                        }
                    })

                // for(const e of user.bag.items) {
                //     e.item.populate('item')
                // }

                return res.json(user)
            } else return res.status(400).json({
                message: 'Bạn chưa đăng nhập!'
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new UserController
