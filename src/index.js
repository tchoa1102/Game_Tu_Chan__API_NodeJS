const express = require('express')
const morgan = require('morgan')

const app = express()
const config = require('./config/server')

const fs = require('fs')
const path = require('path')
const keyPath = path.join(__dirname, '../.env')

if (fs.existsSync(keyPath)) {
    console.log('dotenv is exists!')
    require(keyPath)
}

const db = require('./config/db')

db.connect()

// use
app.use(morgan('combined'))

app.listen(config.port, () => {
    console.log('Welcome to Tu Chan!')
})
