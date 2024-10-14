import { useState } from "react"
import { useRestaurantsContext } from "../hooks/useRestaurantsContext"

const RestaurantForm = () => {
    const { dispatch }  = useRestaurantsContext()
    const [title, setTitle] = useState('')
    const [cuisine, setCuisine] = useState('')
    const [priceRating, setPriceRating] = useState('')
    const [error, setError] = useState(null)
    const [emptyFields, setEmptyFields] = useState([])

    const handleSubmit = async (e) => {
        e.preventDefault()

        const restaurant = {title, cuisine, priceRating}

        const response = await fetch('/api/restaurants', {
            method: 'POST',
            body: JSON.stringify(restaurant),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
            setEmptyFields(json.emptyFields)
        }
        if (response.ok) {
            setTitle('')
            setCuisine('')
            setPriceRating('')
            setError(null)
            setEmptyFields([])
            console.log('new restaurant added', json)
            dispatch({type: 'CREATE_RESTAURANT', payload: json})
        }
    }

    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Add a new Restaurant</h3>

            <label>Restaurant Name:</label>
            <input
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                className={emptyFields.includes('title') ? 'error' : ''}
            />

            <label>Cuisine:</label>
            <input
                type="text"
                onChange={(e) => setCuisine(e.target.value)}
                value={cuisine}
                className={emptyFields.includes('cuisine') ? 'error' : ''}
            />

            <label>Price Rating:</label>
            <input
                type="number"
                onChange={(e) => setPriceRating(e.target.value)}
                value={priceRating}
                className={emptyFields.includes('priceRating') ? 'error' : ''}
            />

            <button>Add Restaurant</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default RestaurantForm