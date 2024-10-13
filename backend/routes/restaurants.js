const express = require('express')
//const Restaurant = require('../models/restaurantModel')
const {
    createRestaurant,
    getRestaurants,
    getRestaurant,
    deleteRestaurant,
    updateRestaurant
} = require('../controllers/restaurantController')

const router = express.Router()

router.get('/', getRestaurants)

router.get('/:id', getRestaurant)

router.post('/', createRestaurant)

router.delete('/:id', deleteRestaurant)

router.patch('/:id', updateRestaurant)

module.exports = router