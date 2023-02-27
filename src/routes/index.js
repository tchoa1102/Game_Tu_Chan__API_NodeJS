const skill = require('./skill')
const auth = require('./auth')
const user = require('./user')
const site = require('./site')

function routes (app) {
    app.use('/skills', skill)
    app.use('/users', user)
    app.use('/auth', auth)
    app.use('/', site)
}

module.exports = routes
