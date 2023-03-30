const { User, Skill, Immortality } = require('../models')

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

    // [PATCH] /api/users/:idUser/embattle
    async embattle(req, res, next) {
        try {
            const body = req.body
            const idImmortality = body.idImmortality
            const index = body.index
            const immortality = await Immortality.findById(idImmortality)
            immortality.index = index
            await immortality.save()
            return res.json(immortality)
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = new UserController
