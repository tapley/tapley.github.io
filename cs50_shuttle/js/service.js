/**
 * service.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Implements a shuttle service.
 */

// default height
var HEIGHT = 0.8;

// default latitude
var LATITUDE = 42.3745615030193;

// default longitude
var LONGITUDE = -71.11803936751632;

// default heading
var HEADING = 1.757197490907891;

// default number of seats
var SEATS = 10;

// default velocity
var VELOCITY = 50;

// default starting time
var time_left = 300;

// default starting score
var score = 0;

// seems legit
var yale = false;

// should probably just keep reading
var reapply = false;

// global reference to shuttle's marker on 2D map
var bus = null;

// global reference to 3D Earth
var earth = null;

// global reference to 2D map
var map = null;

// global reference to shuttle
var shuttle = null;

// load version 1 of the Google Earth API
google.load("earth", "1");

// load version 3 of the Google Maps API
google.load("maps", "3", {other_params: "sensor=false"});

// once the window has loaded
$(window).load(function() {

    // listen for keydown anywhere in body
    $(document.body).keydown(function(event) {
        return keystroke(event, true);
    });

    // listen for keyup anywhere in body
    $(document.body).keyup(function(event) {
        return keystroke(event, false);
    });

    // listen for click on Drop Off button
    $("#dropoff").click(function(event) {
        dropoff();
    });

    // listen for click on Pick Up button
    $("#pickup").click(function(event) {
        pickup();
    });
    
    // listen for click on reapply_rejected button
    $("#reapply_rejected").click(function(event) {
        reapply_rejected();
    });

    // load application
    load();
});

// unload application
$(window).unload(function() {
    unload();
});

/**
 * Renders seating chart.
 */
function chart()
{
    // harvard edition
    if (yale == false)
    {
        var html = "<ol start='0'>";
        for (var i = 0; i < shuttle.seats.length; i++)
        {
            if (shuttle.seats[i] == null)
            {
                html += "<li>Empty Seat</li>";
            }
            else
            {
                html += "<li> " + shuttle.seats[i].name + " (" + shuttle.seats[i].house + ") </li>";
            }
        }
        html += "</ol>";
        $("#chart").html(html);
    }
    // yale edition. displays houses as "Quad" and freshman's houses as "38 Hillhouse"
    else
    {
        var html = "<ol start='0'>";
        for (var i = 0; i < shuttle.seats.length; i++)
        {
            if (shuttle.seats[i] == null)
            {
                html += "<li>Empty Seat</li>";
            }
            else
            {
                // freshman check
                if (HOUSES[shuttle.seats[i].house] == null)
                {                
                    html += "<li> " + shuttle.seats[i].name + " (38 Hillhouse) </li>";
                }
                else
                {
                    // non-freshman display
                    html += "<li> " + shuttle.seats[i].name + " (Quad) </li>";
                };
            };
        };
        html += "</ol>";
        $("#chart").html(html);
    }
}

/**
 * Drops up passengers if their stop is nearby.
 */
function dropoff()
{
    // set dropoff check to false
    var check_for_dropoff = false;
    
    // see if any of the students live in a house nearby
    for (var i in shuttle.seats)
    {              
        // makes sure you're not acting on an empty seat
        if (shuttle.seats[i] !== null)
        {
            // harvard edition
            if (yale == false)
            {
                // check if passenger's house is within 30.0 m
                if (shuttle.distance(HOUSES[shuttle.seats[i].house].lat, HOUSES[shuttle.seats[i].house].lng) <= 30.0)                               
                {
                    // empty seat
                    shuttle.seats[i] = null;
                    
                    // set dropoff check to true
                    check_for_dropoff = true;                              
                    
                    // update score and seating chart
                    score_update(1);
                    chart();                   
                }     
            }
            // yale edition
            else
            {
                // freshman check
                if (HOUSES[shuttle.seats[i].house] == null)
                {
                    // check if 38 Hillhouse is within 30.0 m
                    if (shuttle.distance(41.314543, -72.923743) <= 30.0)                               
                    {
                        // empty seat
                        shuttle.seats[i] = null;
                        
                        // set dropoff check to true
                        check_for_dropoff = true;                              
                        
                        // update score and seating chart
                        score_update(5);
                        chart();                   
                    }
                }
                else
                {
                    // check if a quad house is within 30.0 m
                    if (shuttle.distance(HOUSES["Pforzheimer House"].lat, HOUSES["Pforzheimer House"].lng) <= 30.0 || shuttle.distance(HOUSES["Cabot House"].lat, HOUSES["Cabot House"].lng) <= 30.0 || shuttle.distance(HOUSES["Currier House"].lat, HOUSES["Currier House"].lng) <= 30.0)                               
                    {
                        // empty seat
                        shuttle.seats[i] = null;
                        
                        // set dropoff check to true
                        check_for_dropoff = true;                              
                        
                        // update score and seating chart
                        score_update(1);
                        chart(); 
                    }     
                };
            };         
        };
    };
    // test dropoff check
    if (check_for_dropoff === false)
    {
        $("#announcements").html("<div id=\"announcements\">No students to dropoff here.</div>");     
    };
  
}

/**
 * Called if Google Earth fails to load.
 */
function failureCB(errorCode) 
{
    // report error unless plugin simply isn't installed
    if (errorCode != ERR_CREATE_PLUGIN)
    {
        alert(errorCode);
    }
}

/**
 * Handler for Earth's frameend event.
 */
function frameend() 
{
    shuttle.update();
}

/**
 * Called once Google Earth has loaded.
 */
function initCB(instance) 
{
    // retain reference to GEPlugin instance
    earth = instance;

    // specify the speed at which the camera moves
    earth.getOptions().setFlyToSpeed(100);

    // show buildings
    earth.getLayerRoot().enableLayerById(earth.LAYER_BUILDINGS, true);

    // disable terrain (so that Earth is flat)
    earth.getLayerRoot().enableLayerById(earth.LAYER_TERRAIN, false);

    // prevent mouse navigation in the plugin
    earth.getOptions().setMouseNavigationEnabled(false);

    // instantiate shuttle
    shuttle = new Shuttle({
        heading: HEADING,
        height: HEIGHT,
        latitude: LATITUDE,
        longitude: LONGITUDE,
        planet: earth,
        seats: SEATS,
        velocity: VELOCITY
    });

    // synchronize camera with Earth
    google.earth.addEventListener(earth, "frameend", frameend);

    // synchronize map with Earth
    google.earth.addEventListener(earth.getView(), "viewchange", viewchange);

    // update shuttle's camera
    shuttle.updateCamera();

    // show Earth
    earth.getWindow().setVisibility(true);

    // render seating chart
    chart();

    // populate Earth with passengers and houses
    populate();
    
    // set up timer
    var timerId = window.setInterval("timer()",1000);
    
    // set up score
    $("#score").html("Score: " + score);
}

/**
 * Handles keystrokes.
 */
function keystroke(event, state)
{
    // ensure we have event
    if (!event)
    {
        event = window.event;
    }
    else
    {
        $("#announcements").html("");     
    }

    // left arrow
    if (event.keyCode == 37)
    {
        shuttle.states.turningLeftward = state;
        return false;
    }

    // up arrow
    else if (event.keyCode == 38)
    {
        shuttle.states.tiltingUpward = state;
        return false;
    }

    // right arrow
    else if (event.keyCode == 39)
    {
        shuttle.states.turningRightward = state;
        return false;
    }

    // down arrow
    else if (event.keyCode == 40)
    {
        shuttle.states.tiltingDownward = state;
        return false;
    }

    // A, a
    else if (event.keyCode == 65 || event.keyCode == 97)
    {
        shuttle.states.slidingLeftward = state;
        return false;
    }

    // D, d
    else if (event.keyCode == 68 || event.keyCode == 100)
    {
        shuttle.states.slidingRightward = state;
        return false;
    }
  
    // S, s
    else if (event.keyCode == 83 || event.keyCode == 115)
    {
        shuttle.states.movingBackward = state;     
        return false;
    }

    // W, w
    else if (event.keyCode == 87 || event.keyCode == 119)
    {
        shuttle.states.movingForward = state;    
        return false;
    }
    
    // Y, y
    else if (event.keyCode == 89 || event.keyCode == 121)
    {
        if (yale == false)
        {
            // so it can only happen once
            yale = true;
            
            // just because
            document.title = "Boola boola, bitches.";
            
            // change elements for yale version. fun fact: #0F4D92 is the offical yale blue.
            document.getElementById("start").setAttribute("style", "background-color: #0F4D92; color: #ffffff; border-color: #ffffff");
            document.getElementById("pickup").setAttribute("style", "background-color: #0F4D92; color: #ffffff; border-color: #ffffff");
            document.getElementById("dropoff").setAttribute("style", "background-color: #0F4D92; color: #ffffff; border-color: #ffffff");
            document.getElementById("logo").setAttribute("srcset", "/cs50_shuttle/img/yale-crazy-taxi.png");
            
            // add reapply button
            $("#reapply_rejected").html("<button id=\"reapply\">Reapply</button>");
            
            // update chart
            chart();
            
            alert("Welcome to CS50 Shuttle: Yale Edition!\n\nYour new tasks:\nMove Harvard students to the Quad (1 pt).\nMove Harvard freshmen to Yale (5 pts).");
            return false;
        }
        return false;
    }
  
    return true;
}

/**
 * Loads application.
 */
function load()
{
    // embed 2D map in DOM
    var latlng = new google.maps.LatLng(LATITUDE, LONGITUDE);
    map = new google.maps.Map($("#map").get(0), {
        center: latlng,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        zoom: 17,
        zoomControl: true
    });

    // prepare shuttle's icon for map
    bus = new google.maps.Marker({
        icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/bus.png",
        map: map,
        title: "you are here"
    });

    // embed 3D Earth in DOM
    google.earth.createInstance("earth", initCB, failureCB);
}

/**
 * Picks up nearby passengers.
 */
function pickup()
{   
    for (var i in PASSENGERS)
    {    
        // scan for passengers within 15 meters
        var distance_passenger = shuttle.distance(PASSENGERS[i].lat, PASSENGERS[i].lng);
        if (distance_passenger <= 15.0)
        {
            if (HOUSES[PASSENGERS[i].house] == null && yale == false)
            {
                $("#announcements").html("Get off the bus, freshman!");    
            }
            else
            {
                // set seat check to false
                var check_for_seat_filled = false;
                for (var j in shuttle.seats)
                {                
                    if (shuttle.seats[j] === null)
                    {
                        // add passenger to empty seat
                        shuttle.seats[j] = PASSENGERS[i];
                        
                        // set seat check to true
                        check_for_seat_filled = true;
                        
                        // remove placemark
                        earth.getFeatures().removeChild(PASSENGERS[i].placemark);
                        
                        // remove marker
                        PASSENGERS[i].marker.setMap(null);
                        
                        // remove passenger lat/lng
                        PASSENGERS[i].lat = null;
                        PASSENGERS[i].lng = null;
                        
                        // stop looking for open seats                   
                        break;              
                    }                   
                };
                // test seat check
                if (check_for_seat_filled === false)
                {
                    alert("Not enough empty seats!");            
                };                                                                                      
            };     
        };
        chart();
    };
    
}

/**
 * Populates Earth with passengers and houses.
 */
function populate()
{
    // mark houses
    for (var house in HOUSES)
    {
        // plant house on map
        new google.maps.Marker({
            icon: "https://google-maps-icons.googlecode.com/files/home.png",
            map: map,
            position: new google.maps.LatLng(HOUSES[house].lat, HOUSES[house].lng),
            title: house
        });
    }
    
    // mark Yale admissions (pset asked for houses.js to remain unchanged)
    new google.maps.Marker({       
        icon: "/cs50_shuttle/img/yale-admissions-icon.png",
        map: map,
        position: new google.maps.LatLng(41.314543, -72.923743),
        title: "Yale Undergraduate Admissions"
    });

    // get current URL, sans any filename
    var url = window.location.href.substring(0, (window.location.href.lastIndexOf("/")) + 1);

    // scatter passengers
    for (var i = 0; i < PASSENGERS.length; i++)
    {
        // pick a random building
        var building = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];

        // prepare placemark
        var placemark = earth.createPlacemark("");
        placemark.setName(PASSENGERS[i].name + " to " + PASSENGERS[i].house);

        // prepare icon
        var icon = earth.createIcon("");
        icon.setHref(url + "/img/" + PASSENGERS[i].username + ".jpg");

        // prepare style
        var style = earth.createStyle("");
        style.getIconStyle().setIcon(icon);
        style.getIconStyle().setScale(4.0);

        // prepare stylemap
        var styleMap = earth.createStyleMap("");
        styleMap.setNormalStyle(style);
        styleMap.setHighlightStyle(style);

        // associate stylemap with placemark
        placemark.setStyleSelector(styleMap);

        // prepare point
        var point = earth.createPoint("");
        point.setAltitudeMode(earth.ALTITUDE_RELATIVE_TO_GROUND);
        point.setLatitude(building.lat);
        point.setLongitude(building.lng);
        point.setAltitude(0.0);

        // associate placemark with point
        placemark.setGeometry(point);

        // add placemark to Earth
        earth.getFeatures().appendChild(placemark);

        // add marker to map
        var marker = new google.maps.Marker({
            icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/man.png",
            map: map,
            position: new google.maps.LatLng(building.lat, building.lng),
            title: PASSENGERS[i].name + " at " + building.name
        });

        // store PASSENGERS[i]'s location
        PASSENGERS[i].lat = building.lat;
        PASSENGERS[i].lng = building.lng;
        
        // store PASSENGERS[i]'s placemark
        PASSENGERS[i].placemark = placemark; 
        
        // store PASSENGERS[i]'s marker;
        PASSENGERS[i].marker = marker;       
    }
}

/**
 * Handler for Earth's viewchange event.
 */
function viewchange() 
{
    // keep map centered on shuttle's marker
    var latlng = new google.maps.LatLng(shuttle.position.latitude, shuttle.position.longitude);
    map.setCenter(latlng);
    bus.setPosition(latlng);
}

/**
 * Unloads Earth.
 */
function unload()
{
    google.earth.removeEventListener(earth.getView(), "viewchange", viewchange);
    google.earth.removeEventListener(earth, "frameend", frameend);
}

// updates time. will run every second, per setInterval, until timer reaches zero and the game ends.
function timer()
{
    if (time_left > 0)
    {
        time_left = time_left - 1;
        $("#timer").html("Time: " + time_left);
    }
    else
    {
        alert("Time's up! Your score is: " + score);
        clearInterval(timerID);
    }; 
}

// updates score. will run every time a student is dropped off.
function score_update(points_scored)
{
    score = score + points_scored;
    $("#announcements").html("Good job!");
    $("#score").html("Score: " + score);
}

// corrects then repeats a mistake
function reapply_rejected()
{
    if (reapply == false)
    {
        // transport shuttle, fix mistake
        shuttle.position.latitude = 41.314222;
        shuttle.position.longitude = -72.923404;
        shuttle.localAnchorCartesian = V3.latLonAltToCartesian([shuttle.position.latitude, shuttle.position.longitude, shuttle.position.altitude]);
        
        // face the whale and bio tower
        shuttle.headingAngle = (HEADING* -0.13); 

        $("#announcements").html("Welcome to Yale Undergraduate Admissions!");        
        
        // flip switch in case button is hit again
        reapply = true;
        $("#reapply_rejected").html("<button id=\"reapply\">Rejected?</button>");
        
        // update view
        viewchange();        
    }
    else
    {
        // transport shuttle, repeat mistake
        shuttle.position.latitude = LATITUDE;
        shuttle.position.longitude = LONGITUDE;
        shuttle.localAnchorCartesian = V3.latLonAltToCartesian([shuttle.position.latitude, shuttle.position.longitude, shuttle.position.altitude]);
        
        // face the statue people keep peeing on
        shuttle.headingAngle = HEADING; 
    
        $("#announcements").html("Better luck next year!");  
        
        // flip switch in case button is hit again      
        reapply = false;
        $("#reapply_rejected").html("<button id=\"reapply\">Reapply?</button>");
        
        // update view
        viewchange();   
    }   
}
