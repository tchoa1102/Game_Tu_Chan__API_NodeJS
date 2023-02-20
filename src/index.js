const express = require('express')
const morgan = require('morgan')

const app = express()
const config = require('./config/server')
const db = require('./config/db')

db.connect()

// use
app.use(morgan('combined'))

app.listen(config.port, () => {
    console.log('Welcome to Tu Chan!')
})
