/* user accounts */
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    zipcode VARCHAR(10)
)

/* user weather history */
CREATE TABLE weather_history (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    temperature FLOAT NOT NULL,
    windspeed FLOAT NOT NULL,
    weather_code VARCHAR(5) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);