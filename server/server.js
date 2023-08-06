const express = require('express');
const mysql = require('mysql'); 
const cors = require('cors');
const axios = require('axios');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const bcrypt = require('bcrypt');
const saltRounds = 10

const app = express();

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    key: "userId",
    secret: "Lfivupdv0306-",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, 
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1000,
    },
}));

const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: 'julius06',
    database: 'loginDb'
})

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // First, check if the username already exists in the database
    db.query("SELECT * FROM users WHERE username = ?;", [username], (err, result) => {
        if (err) {
            res.send({ err: err });
        } else {
            // If the username already exists, send an error response
            if (result.length > 0) {
                res.send({ message: "Username already taken. Please choose a different username." });
            } else {
                // If the username is available, hash the password and insert the new user into the database
                bcrypt.hash(password, saltRounds, (hashErr, hash) => {
                    if (hashErr) {
                        console.log(hashErr);
                        res.send({ message: "Error creating user." });
                    } else {
                        db.query("INSERT INTO users (username, password) VALUES (?,?);", [username, hash], (insertErr, insertResult) => {
                            if (insertErr) {
                                console.log(insertErr);
                                res.send({ message: "Error creating user." });
                            } else {
                                res.send({ message: "User registered successfully." });
                            }
                        });
                    }
                });
            }
        }
    });
});


app.get('/login', (req, res)=> {
    if(req.session.user){
        res.send({loggedIn: true, user: req.session.user})
    } else {
        res.send({loggedIn: false})
    }
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.query("SELECT * FROM users WHERE username = ?;", username, (err, result)=>{
        if(err) {
            res.send({err: err})
        }
        
        if (result.length > 0) {
            bcrypt.compare(password, result[0].password, (error, response) => {
                if (response) {
                    req.session.user = result;
                    console.log(req.session.user)
                    res.send(result)
                } else {
                    res.send({message: "Wrong username / password combination"})
                }
            })
        } else {
            res.send({message: "User doesn't exist"})
        }
    })
})

// const weatherAPIKey = 'a5d499bce9f924908dd0964201858037';
// const weatherAPIUrl = 'https://api.openweathermap.org/data/2.5/weather';

// app.get('/weather', (req, res) => {
//   const { lat, lon } = req.query;
//   const params = {
//     lat: parseFloat(lat),
//     lon: parseFloat(lon),
//     appid: weatherAPIKey,
//     units: 'metric', // You can change to 'imperial' for Fahrenheit
//   };

//   // Fetch weather data from OpenWeather API
//   axios.get(weatherAPIUrl, { params })
//     .then((response) => {
//       // Assuming the temperature data is in 'main.temp' field
//       const temperature = response.data.main.temp;
//       res.json({ temperature });
//     })
//     .catch((error) => {
//       console.error('Error fetching weather data:', error);
//       res.status(500).json({ error: 'Error fetching weather data' });
//     });
// });

app.listen(3001, () => {
    console.log('Running on port 3001.')
})