const express = require('express')
const router = express.Router()

router.get('/', function (req, res) {
    return res.json({
        message: 'Home page!'
    })
})

module.exports = router
