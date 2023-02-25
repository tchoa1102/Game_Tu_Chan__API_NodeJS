const skill = require('./skill')

function routes (app) {
    app.use('/', skill)
}

module.exports = routes
