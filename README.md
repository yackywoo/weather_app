# Weather Tracker

Weather Tracking application. This allows you to see the current & 7-day forecast of your city by logging in. All logins are tracked along with that days weather with a PGSQL database. By default, the weather being displayed is the 24-hour weather forecast for Hunter College's campus.

## Features
- **Weather Display**: Shows current weather forecast.
- **Search Zipcode**: Search different city's weather forecast.
- **Historical Data**: Stores every login entry along with the weather forecast at that time.

## Installation
1. **Install dependecies**:
   ```
   npm i
   ```
2. **Run server**:
   ```
   nodemon index.js
   ```
3. **Access the server**: Open yuour web browser and goto `http://localhost:3000/`
