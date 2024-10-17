# import geocoder
from geopy.geocoders import Nominatim
from haversine import haversine, Unit

def get_gps_from_address(address):

    # calling the Nominatim tool and create Nominatim class
    loc = Nominatim(user_agent="Geopy Library")

    # entering the location name
    getLoc = loc.geocode(address)

    # printing address
    # print(getLoc.address)

    # printing latitude and longitude
    # print("Latitude = ", getLoc.latitude, "\n")
    # print("Longitude = ", getLoc.longitude)
    return getLoc.latitude, getLoc.longitude

# def get_current_gps_coordinates():
#     g = geocoder.ip('me')#this function is used to find the current information using our IP Add
#     if g.latlng is not None: #g.latlng tells if the coordiates are found or not
#         return g.latlng
#     else:
#         return None

# if __name__ == "__main__":
#     coordinates = get_current_gps_coordinates()
#     if coordinates is not None:
#         latitude, longitude = coordinates
#         print(f"Your current GPS coordinates are:")
#         print(f"Latitude: {latitude}")
#         print(f"Longitude: {longitude}")
#     else:
#         print("Unable to retrieve your GPS coordinates.")



# get_gps_from_address('174 Main Ave, Wynantskill, NY 12198, USA')