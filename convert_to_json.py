import json

def parse_restaurant_data(file_path):
    with open(file_path, 'r') as file:
        content = file.read().strip()

    # Split the input by the '---' delimiter for each restaurant
    restaurants_data = content.split('---')

    restaurants = []
    
    for restaurant in restaurants_data:
        # Clean up the data and split it by lines
        lines = restaurant.strip().split('\n')
        
        if not lines[0]:  # Skip empty blocks
            continue

        restaurant_info = {}
        images = []
        
        for line in lines:
            line = line.strip()
            if line.startswith("Name:"):
                restaurant_info["Name"] = line[len("Name:"):].strip()
            elif line.startswith("Photo"):
                # Extract image URLs
                images.append(line.split(': ')[1].strip())
            elif line.startswith("Address:"):
                restaurant_info["Address"] = line[len("Address:"):].strip()
            elif line.startswith("Rating:"):
                restaurant_info["Rating"] = line[len("Rating:"):].strip()
            elif line.startswith("Price:"):
                restaurant_info["Price"] = line[len("Price:"):].strip()
            elif line.startswith("Cuisine:"):
                restaurant_info["Cuisine"] = line[len("Cuisine:"):].strip()

        # Add images to the restaurant_info dictionary
        restaurant_info["Images"] = images
        restaurants.append(restaurant_info)

    return restaurants

# Specify the path to your text file
file_path = 'exampleOutputGoogleAPI.txt'  # Change this to your file path
restaurants_list = parse_restaurant_data(file_path)

# Save to JSON file
with open('exampleOutputGoogleAPI.json', 'w') as json_file:
    json.dump(restaurants_list, json_file, indent=4)

# Print to check the output
print(json.dumps(restaurants_list, indent=4))