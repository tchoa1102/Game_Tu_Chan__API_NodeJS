const site = require('./site')
const user = require('./user')
const auth = require('./auth')
const skill = require('./skill')
const quest = require('./quest')
const immortality = require('./immortality')

function routes (app) {
    app.use('/api/skills', skill)
    app.use('/api/quests', quest)
    app.use('/api/immortalities', immortality)
    app.use('/api/users', user)
    app.use('/api/auth', auth)
    app.use('/auth', auth)
    app.use('/api', site)
    app.use('/', site)
}

module.exports = routes
