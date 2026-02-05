
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta
import requests


def weather_data(latitude, longitude, how_long):
    today = datetime.now()
    week_ago = today-timedelta(days=how_long)
    start_date = week_ago.strftime("%Y-%m-%d")
    end_date = today.strftime("%Y-%m-%d")
    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&start_date={start_date}&end_date={end_date}&daily=temperature_2m_max,temperature_2m_min"
    responce = requests.get(url)
    data = responce.json()
    daily_data = data['daily']

    # Create a DataFrame
    df = pd.DataFrame({
        'date': daily_data['time'],
        'max_temp': daily_data['temperature_2m_max'],
        'min_temp': daily_data['temperature_2m_min']
    })

    # Convert date strings to datetime
    df['date'] = pd.to_datetime(df['date'])

    # Create the plot
    plt.figure(figsize=(10, 6))
    plt.plot(df['date'], df['max_temp'], marker='o', label='Max Temp')
    plt.plot(df['date'], df['min_temp'], marker='o', label='Min Temp')

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Temperature (°C)')
    plt.title('gurgaon Weather - Past 7 Days')
    plt.legend()

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45)
    plt.tight_layout()

    # Save the plot
    plt.savefig('weather_chart.png')
    plt.show()


count = int(input("Enter the no of days you wanna se the data of"))
data = weather_data(latitude="26.888450",
                    longitude="75.790547", how_long=count)
