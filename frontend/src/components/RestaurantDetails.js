import { useRestaurantsContext } from '../hooks/useRestaurantsContext'

import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const RestaurantDetails = ({ restaurant }) => {
    const { dispatch } = useRestaurantsContext()

    const handleClick = async () => {
        const response = await fetch('/api/restaurants/' + restaurant._id, {
            method: 'DELETE'
        })
        const json = await response.json()

        if (response.ok) {
            dispatch({type: 'DELETE_RESTAURANT', payload: json})
        }
    }
    
    return (
        <div className="restaurant-details">
            <h4>
                {restaurant.title}
            </h4>
            <p><strong> Cuisine: </strong>{restaurant.cuisine}</p>
            <p><strong> Price Rating: </strong>{restaurant.priceRating}</p>
            <p>{formatDistanceToNow(new Date(restaurant.createdAt), { addSuffix: true })}</p>
            <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
        </div>
    )
}

export default RestaurantDetails