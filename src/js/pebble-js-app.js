/*global
  XMLHttpRequest, Pebble, navigator
*/

"use strict";
var xhrRequest = function (url, type, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            callback(this.responseText);
        };
        xhr.open(type, url);
        xhr.send();
    };

function degrees_to_direction(deg) {
    /*if (deg >= 348.75 || deg < 11.25) return "N";
    else if (deg < 33.75) return "NNE";
    else if (deg < 56.25) return "NE";
    else if (deg < 78.75) return "ENE";
    else if (deg < 101.25) return "E";
    else if (deg < 123.75) return "ESE";
    else if (deg < 146.25) return "SE";
    else if (deg < 168.75) return "SSE";
    else if (deg < 191.25) return "S";
    else if (deg < 213.75) return "SSW";
    else if (deg < 236.25) return "SW";
    else if (deg < 258.75) return "WSW";
    else if (deg < 281.25) return "W";
    else if (deg < 303.75) return "WNW";
    else if (deg < 326.25) return "NW";
    else if (deg < 348.75) return "NNW";
    else return "ERR";*/

    if (deg >= 337.5 || deg < 22.5) { return "N"; }
    if (deg < 67.5) { return "NE"; }
    if (deg < 112.5) { return "E"; }
    if (deg < 157.5) { return "SE"; }
    if (deg < 202.5) { return "S"; }
    if (deg < 247.5) { return "SW"; }
    if (deg < 292.5) { return "W"; }
    if (deg < 337.5) { return "NW"; }
    return "ERR";
}

function dir_to_icon(dir) {
    switch (dir) {
    case "N":
        return "\uF05C";
    case "NE":
        return "\uF05A";
    case "E":
        return "\uF059";
    case "SE":
        return "\uF05D";
    case "S":
        return "\uF060";
    case "SW":
        return "\uF05E";
    case "W":
        return "\uF061";
    case "NW":
        return "\uF05B";
    default:
        return "\uF075";
    }
}

function cond_to_icon(cond_id, day) {

        //Thunder - 200
    if (cond_id <= 221) { return "\uF01E"; }
    if (cond_id <= 232) { return "\uF01D"; }
    //Drizzle/showers
    if ((cond_id >= 300 && cond_id <= 321) || (cond_id >= 520 && cond_id <= 531)) { return "\uF01A"; }
    if (cond_id >= 500 && cond_id <= 504) { return "\uF019"; }
    if (cond_id === 511 || (cond_id >= 611 && cond_id <= 622)) { return "\uF017"; }
    if (cond_id >= 600 && cond_id <= 602) { return "\uF01B"; }
    //Clear or Cloudy
    if (cond_id === 800) {
        if (day) { return "\uF00D"; }
        return "\uF02E";
    }
    if (cond_id === 801 || cond_id === 802) {
        if (day) { return "\uF002"; }
        return "\uF031";
    }
    if (cond_id === 803 || cond_id === 804) { return "\uF013"; }
    if (cond_id === 701 || cond_id === 741) { return "\uF014"; }
    if (cond_id === 711 || cond_id === 721 || cond_id === 731 || cond_id === 751 || cond_id === 761) { return "\uF062"; }
    return "\uF075";
}

function locationSuccess(pos) {
    // Construct URL
    var url = "http://api.openweathermap.org/data/2.5/weather?lat=" + pos.coords.latitude + "&lon=" + pos.coords.longitude + "&API=c8f079185a1a84d713015c96d4118d98";
    console.log("Link is " + url);
    // Send request to OpenWeatherMap
    xhrRequest(url, 'GET',
        function (responseText) {
            // responseText contains a JSON object with weather info
            var json, day, d, now, sunrise, sunset, temp_c, temperature, relative_humidity, b, c, gamma, dp_c, dewpoint, wind_speed, wind_dir, conditions, cond_id, location, dictionary;
            json = JSON.parse(responseText);
            //Day or night?
            //var day = "";
            d = new Date();

            now = d.getTime() / 1000;

            sunrise = json.sys.sunrise;
            sunset = json.sys.sunset;
            if (now >= sunrise && now < sunset) {
                day = true;
            } else {
                day = false;
            }
            console.log("now " + now + " | sunrise " + sunrise + " | sunset " + sunset);
            console.log("Is it day? " + day);
            // Temperature in Kelvin requires adjustment
            temp_c = Math.round(json.main.temp - 273.15);
            console.log("Temp in C is " + temp_c);
            temperature = Math.round(1.8 * temp_c + 32);
            console.log("Temperature is " + temperature);

            relative_humidity = json.main.humidity;
            console.log("RH is " + relative_humidity);
            //Calculate Dew Point from RH and Temp (C)
            //var a = 6.112;
            b = 17.67;
            c = 243.5;
            gamma = Math.log(relative_humidity / 100) + b * temp_c / (c + temp_c);
            console.log("TEMP: gamma is " + gamma);
            dp_c = c * gamma / (b - gamma);
            console.log("TEMP: DP_c is " + dp_c);
            dewpoint = Math.round(1.8 * dp_c + 32);
            console.log("Dewpoint is is " + dewpoint);

            //wind
            wind_speed = Math.round(0.44704 * json.wind.speed);
            wind_dir = degrees_to_direction(json.wind.deg);
            console.log("Wind is from the " + json.wind.deg + "|" + wind_dir + "|" + dir_to_icon(wind_dir) + " at " + wind_speed);

            // Conditions
            conditions = json.weather[0].main;
            cond_id = json.weather[0].id;
            console.log("Conditions are " + conditions + "|" + cond_id + "|" + cond_to_icon(cond_id, day));

            // Get location
            location = json.name;
            console.log("Location is " + location);

            // Assemble dictionary using our keys
            dictionary = {
                "KEY_TEMPERATURE": temperature,
                "KEY_DEWPOINT": dewpoint,
                "KEY_RH": relative_humidity,
                "KEY_CONDITIONS": conditions,
                "KEY_LOCATION": location,
                "KEY_COND_ID": cond_to_icon(cond_id, day)
            };

           // Send to Pebble
            Pebble.sendAppMessage(dictionary,
                function (e) {
                    console.log("Weather info sent to Pebble successfully!" + e);
                },
                function (e) {
                    console.log("Error sending weather info to Pebble!" + e);
                }
                  );
        }
        );
}

function locationError(err) {
    console.log("Error requesting location!" + err);
}

function getWeather() {
    navigator.geolocation.getCurrentPosition(
        locationSuccess,
        locationError,
        {timeout: 15000, maximumAge: 60000}
    );
}

// Listen for when the watchface is opened
Pebble.addEventListener('ready',
    function (e) {
        console.log("PebbleKit JS ready!" + e);
        // Get the initial weather
        getWeather();
    }
    );

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
    function (e) {
        console.log("AppMessage received!" + e);
        getWeather();
    }
    );
