const fs = require('fs')
const path = require('path')

const express = require('express')
const morgan = require('morgan')
const passport = require('passport')
const cookieSession = require('cookie-session')

const app = express()

// Import dotenv
const keyPath = path.join(__dirname, '../.env')
if (fs.existsSync(keyPath)) {
    console.log('dotenv is exists!')
    require(keyPath)
}

const config = require('./config/server')
const router = require('./routes')
const db = require('./config/db')
require('./passport')

// connect to db
db.connect()

// middleware
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
// Cookie
app.use(
    cookieSession({
        name: 'gg-auth-session',
        keys: ['key1', 'key2'],
    }),
)
// Authorize, passport, use cookie
app.use(passport.initialize())
app.use(passport.session())

// use
app.use(morgan('combined'))

// route
router(app)

app.listen(config.port, () => {
    console.log('Welcome to Tu Chan!')
})
