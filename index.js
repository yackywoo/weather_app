import express, { query } from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "weather",
  password: "password",
  port: 5432,
});

db.connect();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//default home landing page
app.get("/", async (req, res) => {
  const zipcode = 10065;
  const email = decodeURIComponent(req.query.email || "");

  //convert zipcode into coordinates
  const geoResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=US&format=json`
  )
  const geoData = await geoResponse.json();
  
  //if valid response load weather
  if (geoData.length > 0 && String(zipcode).length === 5) {
    const latitude = geoData[0].lat;
    const longitude = geoData[0].lon;

    //fetch weather response for given coordinates using open-meteo api
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`
    );

    const data = await response.json();
    const hourlyForecast = data.hourly;
    res.render("home.ejs", {zipcode : zipcode, hourlyForecast : hourlyForecast, email : email });
  } else {
    res.render("home.ejs", {error : "Error", hourlyForecast : null, email : email });
  }
});

//search function
app.get("/search", async (req, res) => { 
  const zipcode = decodeURIComponent(req.query.zipcode || "");
  const email = decodeURIComponent(req.query.email || "");
  try {
    //convert zipcode into coordinates
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=US&format=json`
    )
    const geoData = await geoResponse.json();
    
    //if valid response load weather
    if (geoData.length > 0 && String(zipcode).length === 5) {
      const latitude = geoData[0].lat;
      const longitude = geoData[0].lon;

      //fetch weather response for given coordinates using open-meteo api
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
      );

      const data = await response.json();
      const currWeather = data.current_weather;
      const dailyForecast = data.daily;

      res.render("search.ejs", {currWeather : currWeather, dailyForecast : dailyForecast, email : email, zipcode : zipcode });
      console.log(zipcode + " has been searched and loaded");
    } else {
      res.render("search.ejs", { error: "Invalid zipcode or location not found.", currWeather : null, dailyForecast : null, email : email, zipcode : zipcode });
      console.log(zipcode + " has been searched and failed");
    }
  } catch (err) {
    console.log(err + " occurred while search");
    res.render("search.ejs", { error: "An error occurred while fetching data.", currWeather : null, dailyForecast : null, email : email, zipcode : zipcode });
  }
});

//login page
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
  
//register page
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

//logout function
app.get("/logout", (req, res) => {
  const email = req.query.email || "";
  console.log(email + " has logged out")
  res.redirect("/");
});

//logged-in account loading
app.get("/home", (req, res) => {
  const email = req.query.email || "";
  const zipcode = req.query.zipcode || "";
  const currWeather = req.query.currWeather ? JSON.parse(decodeURIComponent(req.query.currWeather)) : null;
  const dailyForecast = req.query.dailyForecast ? JSON.parse(decodeURIComponent(req.query.dailyForecast)) : null;

  //read all the passed parameters and pass into loggedin.ejs
  console.log(email + " displaying current forecast")
  res.render("loggedin.ejs", {email, zipcode, currWeather, dailyForecast});
});

//register - account creation
app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const zipcode = req.body.zipcode;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    
    //if find email in db, account already exists
    if (checkResult.rows.length > 0) {
      console.log(email + " email already exists");
      res.render("register.ejs", { error: "Email already exists" });
    } else {
      //else if email not in db, then insert into db
      const result = await db.query(
        "INSERT INTO users (email, password, zipcode) VALUES ($1, $2, $3)",
        [email, password, zipcode]
      );
      //direct to login page afterwards
      console.log(email + " account created");
      res.render("login.ejs");
    }
  } catch (err) {
    console.log(err);
  }
});

//account login 
app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try { 
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      //if valid email look for password
      const user = result.rows[0];
      const storedPassword = user.password;
      
      //if matching password then login & load weather
      if (password === storedPassword) {
        //fetch users zipcode that they registered with
        const zipcode = user.zipcode;

        //convert zipcode into coordinates
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=US&format=json`
        )
        const geoData = await geoResponse.json();
        
        //if valid response load weather
        if (geoData.length > 0) {
          const latitude = geoData[0].lat;
          const longitude = geoData[0].lon;

          //fetch weather response for given coordinates using open-meteo api
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
          );

          const data = await response.json();
          const currWeather = data.current_weather;
          const dailyForecast = data.daily;
          console.log(user.email + " logged in");
          console.log(user.zipcode + " weather loaded");
          
          res.redirect(`/home?email=${encodeURIComponent(user.email)}&zipcode=${encodeURIComponent(user.zipcode)}&currWeather=${encodeURIComponent(JSON.stringify(currWeather))}&dailyForecast=${encodeURIComponent(JSON.stringify(dailyForecast))}`);//, { email: user.email, zipcode: zipcode, currWeather: currWeather, dailyForecast : dailyForecast });

          //insert current forecast into weather_history table
          await db.query(
            "INSERT INTO weather_history (email, zipcode, temperature, windspeed, weather_code) VALUES ($1, $2, $3, $4, $5)",
            [user.email, user.zipcode, currWeather.temperature, currWeather.windspeed, currWeather.weathercode]
          );
        } else {
          //else invalid weather response
          console.log(user.email + " invalid zipcode");
          console.log(user.zipcode + " failed to load");
          res.render("login.ejs", { error: "Invalid zipcode" });
        }
      } else {
        //if incorrect password
        console.log(user.email + " wrong password");
        res.render("login.ejs", { error: "Wrong password" });
      }
    } else {
      //if email not found
      console.log(user.email + " not found");
      res.render("login.ejs", { error: "User not found" });
    }
  } catch (err) {
    console.log(err);
  }
});

//logged in - account history
app.get("/history", async (req, res) => {
  const email = req.query.email || ""; 
  const currWeather = req.query.currWeather ? JSON.parse(decodeURIComponent(req.query.currWeather)) : null;
  const dailyForecast = req.query.dailyForecast ? JSON.parse(decodeURIComponent(req.query.dailyForecast)) : null;
  
  try {
    const historyResult = await db.query(
      "SELECT * FROM weather_history WHERE email = $1 ORDER BY date DESC",
      [email]
    );
    //in history zipcode should be their most recent so it doesn't redirect to search result page when going back to '/home' 
    const zipcodeData = await db.query( 
      "SELECT * FROM users WHERE EMAIL = $1",
      [email]
    )
    const user = zipcodeData.rows[0];
    const zipcode = user.zipcode;
    console.log(email + " displaying history");
    res.render("history.ejs", { email, zipcode, currWeather, dailyForecast, weatherHistory: historyResult.rows });
  } catch (err) {
    console.error(err);
    console.log(email + " failed to load history")
    res.render("history.ejs", { error: "Failed to load history." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});