import json
from get_location import get_gps_from_address
from haversine import haversine, Unit

def ranking_algorithm(restaurants, preferences, location):
    PRICE_WEIGHT = 4
    DISTANCE_WEIGHT = 3
    CUISINE_WEIGHT = 2
    RATING_WEIGHT = 1
    restaurantScores = []
    
    for restaurant in restaurants:
        totalScore = 0
        restaurantPrice = len(restaurant['Price'])
        restaurantDistance = calculateDistance(location, restaurant['Address'])

        for user in preferences:
            if restaurantPrice <= user['Price'][1]:
                priceScore = calculatePriceScore(restaurantPrice, user['Price'][1])
            else:
                priceScore = 0
            
            if restaurantDistance <= user['Distance']:
                distanceScore = calculateDistanceScore(restaurantDistance, user['Distance'])
            else:
                distanceScore = 0
            
            cuisineScore = 0
            if user['Cuisine'] in restaurant['Cuisine']:
                cuisineScore = 1 
            
            ratingScore = calculateRatingScore(restaurant['Rating'], user['Rating'])
            print(restaurant['Name'])
            print(user['Name'])
            print(priceScore)
            print(distanceScore)
            print(cuisineScore)
            print(ratingScore)
            totalScore += (priceScore * PRICE_WEIGHT) + (distanceScore * DISTANCE_WEIGHT) + (cuisineScore * CUISINE_WEIGHT) + (ratingScore * RATING_WEIGHT)
        
        restaurantScores.append((restaurant, totalScore))
        # print(restaurantScores)
    
    # Sort the restaurants based on total score in descending order
    sortedRestaurants = sorted(restaurantScores, key=lambda x: x[1], reverse=True)
    [print(restaurant[0]['Name'], restaurant[1]) for restaurant in sortedRestaurants]
    
    return sortedRestaurants

def calculateDistance(location, endAddress):
    if '#' in endAddress:
        temp = endAddress.split()
        endAddress = ' '.join([string for string in temp if '#' not in string])
    
    lat1, lon1 = float(location.split(',')[0]), float(location.split(',')[1])  # get_gps_from_address(location)
    try:
        lat2, lon2 = get_gps_from_address(endAddress)
    except:
        return 0

    # Calculate distance
    distance = haversine((lat1, lon1), (lat2, lon2), unit=Unit.MILES)

    return distance

def calculatePriceScore(restaurantPrice, userMaxPrice):
    return max(0, userMaxPrice - restaurantPrice)

def calculateDistanceScore(restaurantDistance, userMaxDistance):
    return max(0, userMaxDistance - restaurantDistance)

def calculateRatingScore(restaurantRating, userMinRating):
    return max(0, float(restaurantRating) - userMinRating)


def main():
    with open('exampleOutputGoogleAPI.json', 'r') as file:
        restaurants = json.load(file)
        # print(restaurants)
        # print("Type:", type(restaurants))
    
    with open('exampleInputGoogleAPI.json', 'r') as file:
        preferences = json.load(file)
        # print(preferences)
        # print("Type:", type(preferences))
    location  = '42.7284,-73.6918'
    ranking_algorithm(restaurants, preferences, location)
    return

if __name__ == '__main__':
    main()

# price -> +4
# distance -> +3
# cuisine -> +2
# rating -> +1

# for restaurant in restaurants:
#   if restaurant price <= price of preference

