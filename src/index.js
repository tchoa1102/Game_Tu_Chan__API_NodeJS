const fs = require('fs')
const path = require('path')

const express = require('express')
const morgan = require('morgan')
const passport = require('passport')
const cookieSession = require('cookie-session')

const cron = require('node-cron')

const app = express()

const { Market, } = require('./app/models')

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

// Schedules
let updateMarket = cron.schedule('0 0 6,12,19 * * *', async () => {
    console.log('\n\n --------------------------------\nUpdate Market')
    const market = await Market.find({})
    const itemsSize = market.length
    
    await Market.updateMany({ isPost: true }, { isPost: false })

    const itemsShow = []
    const indexShow = {}
    for(let i = 0; i < 20 && i < itemsSize; i++) {
        const index = Math.floor(Math.random() * itemsSize)
        if ( !indexShow[index] ) {
            indexShow[index] = true
            itemsShow.push(market[index]._id)
        }
    }

    await Market.updateMany({ _id: { $in: itemsShow } }, { isPost: true })
    console.log('\n================================\n')
})

updateMarket.start()

// route
router(app)

app.use((error, req, res, next) => {
    console.log(error)
    return res.status(500).json({
        message: 'Có lỗi xảy ra!'
    })
})

app.listen(config.port, () => {
    console.log('Welcome to Tu Chan!')
})
