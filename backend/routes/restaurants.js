const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.json({mssg: 'GET all restaurants'})
})

router.get('/:id', (req, res) => {
    res.json({mssg: 'GET a single restaurant'})
})

router.post('/', (req, res) => {
    res.json({mssg: 'POST a new restaurant'})
})

router.delete('/:id', (req, res) => {
    res.json({mssg: 'DELETE a restaurant'})
})

router.patch('/:id', (req, res) => {
    res.json({mssg: 'UPDATE a restaurant'})
})

module.exports = router