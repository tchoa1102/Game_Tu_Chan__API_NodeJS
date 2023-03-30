const { User, Skill } = require('../models')

class UserController {
    // [GET] /api/users/whoami
    async get(req, res, next) {
        console.log("\n\n\nGet user...")
        try {
            // console.log("Auth", req.session.passport.user.emails)
            if (req.session.passport?.user) {
                console.log('json')
                const user = await User.findOne({ _id: req.session.passport.user._id }).populate({
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
