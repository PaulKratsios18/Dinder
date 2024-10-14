import { useEffect } from 'react'
import RestaurantDetails from '../components/RestaurantDetails'
import RestaurantForm from '../components/RestaurantForm'
import { useRestaurantsContext } from "../hooks/useRestaurantsContext"

const Home = () => {
    const {restaurants, dispatch} = useRestaurantsContext()

    useEffect(() => {
        const fetchRestaurants = async () => {
            const response = await fetch('/api/restaurants')
            const json = await response.json()

            if (response.ok) {
                dispatch({type: 'SET_RESTAURANTS', payload: json})
            }
        }
        fetchRestaurants()
    }, [dispatch])


    return (
        <div className="home">
            <div className="restaurants">
                {restaurants && restaurants.map((restaurant) => (
                    <RestaurantDetails key={restaurant._id} restaurant={restaurant} />
                ))}
            </div>
            <RestaurantForm />    
        </div>
    )
}

export default Home