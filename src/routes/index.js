const skill = require('./skill')
const site = require('./site')

function routes (app) {
    app.use('/skills', skill)
    app.use('/', site)
}

module.exports = routes
