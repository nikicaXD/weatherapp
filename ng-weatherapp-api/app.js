// Imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const port = process.env.PORT || 8080;
const axios = require('axios');

// Express
const app = express();

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: 'https://ng-weatherapp.herokuapp.com', optionsSuccessStatus: 200, credentials: true }));
// Cors   UWP_CORS_ORIGIN
// app.use(cors({ origin: process.env.UWP_CORS_ORIGIN, optionsSuccessStatus: 200, credentials: true }));
// // app.options('*', cors());
// // app.all('/*', (req, res, next) => {
// //     res.header("Access-Control-Allow-Origin", "*");
// //     res.header("Access-Control-Allow-Headers", "X-Requested-With");
// //     next();
// // });

const cfg = {
    hereApiKey: process.env.HERE_API_KEY,
    owKey: process.env.OPEN_WEATHER_API_KEY,
    groupRoutesBy: 6,
    baseTemp: 20
}

const difference = (num1, num2) => (num1 > num2) ? num1 - num2 : num1 + num2;

const fetchWeatherData = async (lat, long) => {
    return (await axios(`https://api.openweathermap.org/data/2.5/weather?lat=${(lat)}&lon=${(long)}&units=metric&appid=${cfg.owKey}`)).data.main.temp
}

// The HERE API will bitch about foreign chars...
const charsToReplace = [
    ['Ž', 'Z'],
    ['Č', 'C'],
    ['Š', 'S'],
    ['Á', 'A'],
    ['Ć', 'C'],
    ['Đ', 'D']
]

const fetchRoutesInbetween = async (loc1, loc2, mode, routeResponse) => {

    // Fetch GeoCodes of both locations
    let geoCodes = [];
    let locations = [loc1, loc2];
    for(let i = 0; i < locations.length; i++) {
        let loc = locations[i];

        // Replace foreign chars
        charsToReplace.forEach(([before, after]) => {
            loc = loc.split(before.toLowerCase()).join(after.toLowerCase())
            loc = loc.split(before).join(after)
        })

        console.log(`Location: ${i}: ${loc}`)
        let geoCode = (await axios.get(`https://geocoder.ls.hereapi.com/6.2/geocode.json?apiKey=${cfg.hereApiKey}&searchtext=${loc}`)).data.Response.View[0].Result[0].Location.DisplayPosition
        if(geoCode.Latitude !== null)
            geoCodes.push(`geo!${geoCode.Latitude},${geoCode.Longitude}`);
        else {
            routeResponse.sendStatus(500);
            return;
        }
            
    }
    const [geoStart, geoEnd] = geoCodes;
    
    // All routes inbetween
    let res = (await axios(`https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${cfg.hereApiKey}&mode=fastest;${mode};traffic:disabled&waypoint0=${geoStart}&waypoint1=${geoEnd}`))
              .data.response.route[0].leg[0].maneuver
    
    let allRoutesInbwetween = [];
    let bestRoutesInbwetween = [];
    let bestInGroup = { 
        temp: 1000,
        tempDiff: 0,
        lat: null,
        lng: null
    };

    for(let i = 0; i < res.length ; i++) {
        let {latitude, longitude} = res[i].position;
        let temperature = await fetchWeatherData(latitude, longitude);

        let currentDiffToTempBase = difference(temperature, cfg.baseTemp);
        if (
            (difference(currentDiffToTempBase, bestInGroup.tempDiff) < difference(bestInGroup.temp, bestInGroup.tempDiff))
            ||
            (i % cfg.groupRoutesBy === 1)
        ) 
            bestInGroup = {
                tempDiff: currentDiffToTempBase,
                temp: temperature,
                lat: latitude,
                lng: longitude
            }
        
        allRoutesInbwetween.push({
            lat: latitude,
            lng: longitude
        });
        
        // Reset the group after pushing the best route in the group
        if( (i % cfg.groupRoutesBy === 0) || (i == res.length-1) ) {
            bestRoutesInbwetween.push({...bestInGroup});

            bestInGroup = {
                tempDiff: -1000,
                lat: null,
                lng: null
            };
        }
    }

    return bestRoutesInbwetween;
}

const fetchBestRoute = async (locations, mode, res) => {
    return new Promise(async (resolve, reject) => {
        if(locations.length == 2) {
            try {
                resolve(await fetchRoutesInbetween(locations[0], locations[1], mode, res));
            } catch(err) {
                reject(err);
            }
        } else if (locations.length > 2)  {
            try {
                let collectionOfRoutes = [];
                for(let i = 0; i < locations.length - 1; i++) {
                    let one = await fetchRoutesInbetween(locations[i], locations[i + 1], mode, res);
                    collectionOfRoutes = [...collectionOfRoutes, ...one]
                }
                resolve(collectionOfRoutes)
            } catch(err) {
                reject(err);
            }
        }
    });
}

// Main
app.post('/', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.header('Access-Control-Allow-Credentials', true);

    let { locations, mode } = req.body;

    if(!locations)
        return res.sendStatus(500);
    
    // Default to the pedestrian mode if it isn't provided
    if(!mode || (mode != 'pedestrian' && mode != 'car'))
        mode = 'pedestrian';

    fetchBestRoute(locations, mode, res)
        .then(brRes => res.send(brRes))
        .catch(err => err.status(500));
});

// 404
app.get('*', (req, res, next) => res.sendStatus(404));
app.post('*', (req, res, next) => res.sendStatus(404));

app.listen(port, () => console.log(`Listening on port ${port}`));