const skill = require('./skill')
const auth = require('./auth')
const user = require('./user')
const site = require('./site')

function routes (app) {
    app.use('/api/skills', skill)
    app.use('/api/users', user)
    app.use('/api/auth', auth)
    app.use('/auth', auth)
    app.use('/api', site)
    app.use('/', site)
}

module.exports = routes
