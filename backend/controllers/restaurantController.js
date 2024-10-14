const Restaurant = require('../models/restaurantModel')
const mongoose = require('mongoose')


const getRestaurants = async (req, res) => {
    const restaurants = await Restaurant.find({}).sort({createdAt: -1})

    res.status(200).json(restaurants)
}

const getRestaurant = async (req, res) => {
    const {id} = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json('Not valid')
    }

    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
        return res.status(400).json({error: 'No such restaurant found'})
    }

    res.status(200).json(restaurant)
}

const createRestaurant =  async (req, res) => {
    const {title, cuisine, location, priceRating} = req.body

    let emptyFields = []
    if (!title) {
        emptyFields.push('title')
    }
    if (!cuisine) {
        emptyFields.push('cuisine')
    }
    if (!priceRating) {
        emptyFields.push('priceRating')
    }
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all required fields', emptyFields })
    }

    try {
        const restaurant = await Restaurant.create({title, cuisine, location, priceRating})
        res.status(200).json(restaurant)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

const deleteRestaurant =  async (req, res) => {
    const {id} = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json('Not valid')
    }

    const restaurant = await Restaurant.findOneAndDelete({_id: id})

    if (!restaurant) {
        return res.status(400).json({error: 'No such restaurant found'})
    }
    res.status(200).json(restaurant)
}

const updateRestaurant =  async (req, res) => {
    const {id} = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json('Not valid')
    }

    const restaurant = await Restaurant.findOneAndUpdate({_id: id}, {
        ...req.body
    })

    if (!restaurant) {
        return res.status(400).json({error: 'No such restaurant found'})
    }
    res.status(200).json(restaurant)
}

module.exports = {
    getRestaurants,
    getRestaurant,
    createRestaurant,
    deleteRestaurant,
    updateRestaurant
}