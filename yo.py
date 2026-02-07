import requests

# We need coordinates to get weather data
latitude = 28.111111   # Paris latitude
longitude = 77.021694   # Paris longitude

# Build the API URL with our parameters
url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m"

# Make the request
response = requests.get(url)

data = response.json()
print(data.keys())
Temperature = data["current"]["temperature_2m"]
print(f"Temperature of my current location is {Temperature}C")
