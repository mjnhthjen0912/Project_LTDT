var map;
var marker;
var locationVietNam = {lat:15, lng:105};
var iconBase = './icons/';
var infowindow;
var infohover;
var myLocation;
var markersArray = [];
var destinationArray = [];
var distanceArray = [];
var durationArray = [];
var origin;
var destination;
var markerDirectionArrayPub =[];
var directionsService;
var directionsDisplay;
var stepDisplay;
var polyline;
var bounds;
var lineSymbol;
var speedValue= (101 - 75) * 20;
var type = 'hospital';
var locationKind = 1;
var markerStart;
var markerEnd;
var startToEnd=false;
var allowEnd=false;

window.onload=function () {
    document.getElementById('control').style.display = "flex";
    document.getElementById('onload').style.display = "none";
};

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: locationVietNam,
        disableDefaultUI: true,
        panControl: false,
        panControlOptions: {
            style: google.maps.ControlPosition.BOTTOM_LEFT
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true
    });
    marker= new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.DROP,
        icon:  iconBase + 'mylocation.png'
    });
    marker.setAnimation(google.maps.Animation.BOUNCE);
    addYourLocationButton(map, marker);
    marker.addListener('click', toggleBounce);
    google.maps.event.addDomListener(window, 'load', searchDisplayFunc);

    infowindow = new google.maps.InfoWindow();
    infohover = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer({map: map, draggable: true, suppressMarkers: true});
    stepDisplay = new google.maps.InfoWindow;
    lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 4,
        strokeColor: '#321f61',
        fillColor: '#6b529f',
        fillOpacity: 1
    };
    polyline = new google.maps.Polyline({
        path: [],
        icons: [{
            icon: lineSymbol,
            offset: '100%'
        }],
        strokeColor: 'rgba(255, 255, 255, 0)',
        strokeWeight: 3
    });
    bounds = new google.maps.LatLngBounds();

    var searchDisplayPanel = document.getElementById('left-panel');
    searchDisplayPanel.display = 'block';
    map.controls[google.maps.ControlPosition.LEFT_CENTER].push(searchDisplayPanel);

    var controlSearchMap = document.getElementById("searchMap");
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlSearchMap);

    google.maps.event.addListener(map, 'click', function(event) {
        placeMarker(event.latLng);
    });

    directionsDisplay.addListener('directions_changed', function() {

        if (directionsDisplay.getDirections()) {
            changeAnimating(directionsDisplay.getDirections());
        }
    });
}

function searchDisplayFunc() {
    var searchText = document.getElementById("searchTextBox");
    var searchBox = new google.maps.places.SearchBox(searchText);
    google.maps.event.addListener(searchBox, 'places_changed', function() {
        searchBox.set('map', null);
        var places = searchBox.getPlaces();

        var bounds = new google.maps.LatLngBounds();
        var i, place;
        for (i = 0; place = places[i]; i++) {
            (function(place) {
                var marker = new google.maps.Marker({
                    position: place.geometry.location,
                    icon: iconBase + 'ic_room_black_purple_36dp_1x.png',
                    animation: google.maps.Animation.BOUNCE
                });
                marker.bindTo('map', searchBox, 'map');
                google.maps.event.addListener(marker, 'map_changed', function () {
                    if (!this.getMap()) {
                        this.unbindAll();
                    }
                });
                bounds.extend(place.geometry.location);
                //myLocation = place.geometry.location;
            }(place));

        }
        map.fitBounds(bounds);
        searchBox.set('map', map);
        map.setZoom(Math.min(map.getZoom(),12));

    });
}

function placeMarker(location) {
    if(startToEnd==false) {
        if (markerStart)
            markerStart.setMap(null);
    }
    else{
        if(markerEnd)
            markerEnd.setMap(null);
    }

    if(startToEnd==false)
    {
        markerStart = new google.maps.Marker({
            icon: iconBase + "ic_room_black_purple_S_36dp_1x.png",
            title: 'Nhấp và kéo tới điểm bắt đầu!',
            position: location,
            map: map
        });
        startToEnd=true;
        //startMarkerDrag(location);
        //markerStart.addListener('drag', startMarkerDragend());
        markerStart.addListener('dragend', startMarkerDrag(markerStart.getPosition()));

    }
    else{
        markerEnd = new google.maps.Marker({
            icon: iconBase + "ic_room_black_purple_G_36dp_1x.png",
            title: 'Nhấp và kéo tới điểm đến!',
            position: location,
            map: map
        });
        startToEnd=false;
        //markerEnd.addListener('drag', endMarkerDragend());
        markerEnd.addListener('dragend', endMarkerDrag(markerEnd.getPosition()));
    }


}

function startMarkerDrag(position) {
    document.getElementById('Start').className += ' is-dirty';
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'latLng': position
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                document.getElementById('textboxStart').value=results[0].formatted_address;
            }
        }
    });
}

function endMarkerDrag(position) {
    document.getElementById('End').className += ' is-dirty';
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'latLng': position
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                document.getElementById('textboxEnd').value=results[0].formatted_address;
            }
        }
    });
}

function animateCircle(polyline) {
    var count = 0;

    window.setInterval(function() {
        count = (count + 1) % speedValue;

        var icons = polyline.get('icons');
        icons[0].offset = (count / (speedValue/100)) + '%';
        polyline.set('icons', icons);
    }, 20);
}


function searchDirection() {
    if(locationKind==1) {
        if(allowEnd==false)
        {
            if (myLocation) {
                origin = myLocation;
                search(origin, '');
            }
            else {
                alert('Bấm nút lấy địa điểm của bạn!');
            }
        }
        else{
            if (myLocation) {
                if (markerEnd) {
                    destination=markerEnd.getPosition();
                    origin = myLocation;
                    search(origin, destination);
                }
            }
            else {
                alert('Bấm nút lấy địa điểm của bạn!');
            }
        }
    }
    else {
        if (allowEnd == false) {
            if (markerStart) {
                origin = markerStart.getPosition();
                search(origin, '');
            }
            else {
                alert('Click chuột trên bản đồ chọn một điểm bắt đầu!');
            }
        }
        else {
            if (markerStart) {

                if (markerEnd) {
                    destination = markerEnd.getPosition();
                    origin = markerStart.getPosition();
                    search(origin, destination);
                }
            }
            else {
                alert('Click chuột trên bản đồ chọn một điểm bắt đầu!');
            }
        }
    }


}

function sort() {
    for (var i = 0; i < distanceArray.length-1; i++) {
        for(var j=i+1; j<distanceArray.length;j++){
            if(distanceArray[j]<distanceArray[i])
            {
                var x = distanceArray[j];
                var y = destinationArray[j];
                var z = markersArray[j];
                distanceArray[j]=distanceArray[i];
                distanceArray[i]=x;
                destinationArray[j]=destinationArray[i];
                destinationArray[i]=y;
                markersArray[j]=markersArray[i];
                markersArray[i]=z;
            }
        }
    }
    drawingDirection(destinationArray[0]);
    toggleBounceFound(markersArray[0]);
}

function drawingDirection(Point)
{
    calculateAndDisplayRoute(directionsDisplay, directionsService, stepDisplay, map, Point);

}

function calculateAndDisplayRoute(directionsDisplay, directionsService
    , stepDisplay, map, Point) {
    // First, remove any existing markers from the map.

    polyline.setMap(null);
    polyline = new google.maps.Polyline({
        path: [],
        icons: [{
            icon: lineSymbol,
            offset: '100%'
        }],
        strokeColor: 'rgba(255, 255, 255, 0)',
        strokeWeight: 3
    });
    if(allowEnd==false) {
        // Retrieve the start and end locations and create a DirectionsRequest using
        // WALKING directions.
        directionsService.route({
            origin: origin,
            destination: Point,
            avoidTolls: false,
            avoidHighways: false,
            region:"VN",
            travelMode: 'DRIVING'
        }, function (response, status) {
            // Route the directions and pass the response to a function to create
            // markers for each step.
            if (status === 'OK') {
                document.getElementById('warnings-panel').innerHTML =
                    '<b>' + response.routes[0].warnings + '</b>';
                directionsDisplay.setDirections(response);
                showSteps(response, stepDisplay, map);
                directionsDisplay.setMap(map);
                directionsDisplay.setPanel(document.getElementById('left-panel'));
                map.fitBounds(bounds);

            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }
    else
    {
        // Retrieve the start and end locations and create a DirectionsRequest using
        // WALKING directions.
        var waypts = [];
        waypts.push({
            location: Point,
            stopover: true
        })
        directionsService.route({
            origin: origin,
            destination: destination,
            waypoints: waypts,
            avoidTolls: false,
            avoidHighways: false,
            region:"VN",
            travelMode: 'DRIVING'
        }, function (response, status) {
            // Route the directions and pass the response to a function to create
            // markers for each step.
            if (status === 'OK') {
                document.getElementById('warnings-panel').innerHTML =
                    '<b>' + response.routes[0].warnings + '</b>';
                directionsDisplay.setDirections(response);
                showSteps(response, stepDisplay, map);
                directionsDisplay.setMap(map);
                directionsDisplay.setPanel(document.getElementById('left-panel'));
                map.fitBounds(bounds);

            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });

    }
}

function showSteps(directionResult, stepDisplay, map) {
    for (var i = 0; i < markerDirectionArrayPub.length; i++) {
        markerDirectionArrayPub[i].setMap(null);
    }
    markerDirectionArrayPub=[];
    if (allowEnd == false) {
        var myRoute = directionResult.routes[0].legs[0];
        for (var i = 0; i < myRoute.steps.length; i++) {
            var marker = markerDirectionArrayPub[i] = markerDirectionArrayPub[i] || new google.maps.Marker({
                    icon: iconBase + 'ic_location_on_black_blue_24dp_1x.png'
                });
            marker.setMap(map);
            marker.setPosition(myRoute.steps[i].start_location);
            attachInstructionText(
                stepDisplay, marker, myRoute.steps[i].instructions, map);
        }
    }
    else
    {
        var l =0;
        for(var j=0;j<2;j++) {
            var myRoute = directionResult.routes[0].legs[j];
            for (var i = 0; i < myRoute.steps.length; i++) {
                var marker = markerDirectionArrayPub[i+l] = markerDirectionArrayPub[i+l] || new google.maps.Marker({
                        icon: iconBase + 'ic_location_on_black_blue_24dp_1x.png'
                    });
                marker.setMap(map);
                marker.setPosition(myRoute.steps[i].start_location);
                attachInstructionText(
                    stepDisplay, marker, myRoute.steps[i].instructions, map);
            }
            l=l+myRoute.steps.length;
        }
    }

}

function attachInstructionText(stepDisplay, marker, text, map) {
    google.maps.event.addListener(marker, 'mouseover', function() {
        // Open an info window when the marker is clicked on, containing the text
        // of the step.
        stepDisplay.setContent(text);
        stepDisplay.open(map, marker);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
        stepDisplay.close();
    });
}


function search(origin, destination) {
    clearMarkers();
    if(allowEnd==false) {
        var service = new google.maps.places.PlacesService(map);
        var search = {
            location: origin,
            keyword: document.getElementById('textboxKeyword').value,
            name: "",
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: [type]
        };

        service.nearbySearch(search, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                destinationArray = [];
                for (var i = 0; i < results.length; i++) {

                    createMarker(results[i], i);
                    setTimeout(dropMarker(i), i * 100);
                }

                var origins = [];
                origins.push(origin);
                getDistanceMatrix(origins, destinationArray);
            }
        })
    }
    else{
        var len;
        var service = new google.maps.places.PlacesService(map);
        var search = {
            location: origin,
            keyword:  document.getElementById('textboxKeyword').value,
            name: "",
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: [type]
        };

        service.nearbySearch(search, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                destinationArray = [];
                var resultTemp=results;
                for (var i = 0; i < results.length; i++) {
                    createMarker(results[i], i);
                    setTimeout(dropMarker(i), i * 100);
                }
                len=results.length;
                var origins = [];
                origins.push(origin);
                //getDistanceMatrix1(origins, destinationArray);


                var service2 = new google.maps.places.PlacesService(map);
                var search2 = {
                    location: destination,
                    keyword:  document.getElementById('textboxKeyword').value,
                    name: "",
                    rankBy: google.maps.places.RankBy.DISTANCE,
                    types: [type]
                };

                service2.nearbySearch(search2, function (results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        var resultsLen = results.length;
                        for (var i = 0; i < resultsLen; i++) {
                            var compare = false;
                            for(var j=0;j<resultTemp.length;j++) {
                                if (results[i].place_id == resultTemp[j].place_id) {
                                    compare=true;
                                    break;
                                }
                            }
                            if(compare==false) {
                                var temp = i + len;
                                createMarker(results[i], temp);
                                setTimeout(dropMarker(temp), temp * 100);
                            }
                            else
                            {
                                resultsLen--;
                                i--;
                            }
                        }

                        origins.push(destination);
                        getDistanceMatrix(origins, destinationArray);
                    }
                })
            }
        })
    }
}

function getDistanceMatrix(origin, destination) {
    if(allowEnd==false) {
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: origin,
                destinations: destination,
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, function (response, status) {
                if (status == 'OK') {
                    var origins = response.originAddresses;
                    var destinations = response.destinationAddresses;
                    distanceArray = [];
                    durationArray = [];
                    for (var i = 0; i < origins.length; i++) {
                        var results = response.rows[i].elements;
                        for (var j = 0; j < results.length; j++) {
                            var element = results[j];
                            var distance = element.distance.value;
                            var duration = element.duration.value;
                            var from = origins[i];
                            var to = destinations[j];
                            distanceArray[j] = distance;
                            durationArray[j] = duration;
                        }
                    }
                    sort();
                }
            });
    }
    else
    {
        var x = 0;
        var y = 0;
        for(var l = 0; l<origin.length;l++) {

            for (var n = 0; n < origin.length; n++) {
                var or = [];
                or.push(origin[l]);
                var des = [];
                var item = Math.floor(destination.length / origin.length);
                for (var m = 0; m < item; m++) {
                    var v=m + (n*item);
                    des.push(destination[v]);
                    if(m==item && (destination.length%2)==1 && n==1)
                    {
                        des.push(destination[item]);
                    }
                }
                var service = new google.maps.DistanceMatrixService();
                service.getDistanceMatrix(
                    {
                        origins: or,
                        destinations: des,
                        travelMode: 'DRIVING',
                        unitSystem: google.maps.UnitSystem.METRIC,
                        avoidHighways: false,
                        avoidTolls: false
                    }, function (response, status) {
                        if (status == 'OK') {
                            if(y==2)
                            {
                                x++;
                                y=0;
                            }

                            var origins = response.originAddresses;
                            var destinations = response.destinationAddresses;
                            if (x == 0 && y==0 ) {
                                distanceArray = [];
                                durationArray = [];
                            }
                            for (var i = 0; i < or.length; i++) {
                                var results = response.rows[i].elements;
                                for (var j = 0; j < results.length; j++) {
                                    var element = results[j];
                                    var distance = element.distance.value;
                                    var duration = element.duration.value;
                                    var from = origins[i];
                                    var to = destinations[j];
                                    if (x == 0) {
                                        distanceArray[j + (y * (Math.floor(destination.length / origin.length)))] = distance;
                                        durationArray[j + (y * (Math.floor(destination.length / origin.length)))] = duration;
                                    }
                                    else {
                                        distanceArray[j + (y * (Math.floor(destination.length / origin.length)))] += distance;
                                        durationArray[j + (y * (Math.floor(destination.length / origin.length)))] += duration;
                                    }
                                }
                            }
                            y++;
                            if(x==1&&y==2)
                            {
                                sort();
                            }
                        }
                    });
            }
        }

    }
}


function changeAnimating(response) {
    polyline.setMap(null);
    showSteps(response, stepDisplay, map);
    polyline = new google.maps.Polyline({
        path: [],
        icons: [{
            icon: lineSymbol,
            offset: '100%'
        }],
        strokeColor: 'rgba(255, 255, 255, 0)',
        strokeWeight: 3
    });
    var legs = response.routes[0].legs;
    for (i = 0; i < legs.length; i++) {
        var steps = legs[i].steps;
        for (j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            for (k = 0; k < nextSegment.length; k++) {
                polyline.getPath().push(nextSegment[k]);
                bounds.extend(nextSegment[k]);
            }
        }
    }
    polyline.setMap(map);
    animateCircle(polyline);

}

function createMarker(place, i) {
    var placeLoc = place.geometry.location;

    markersArray[i] = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        icon:  iconBase + 'ic_room_black_pink_36dp_1x.png',
        position: placeLoc
    });
    destinationArray[i] = markersArray[i].position;
    google.maps.event.addListener(markersArray[i], 'click', function() {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
        drawingDirection(placeLoc);
        for(var j=0; j<markersArray.length;j++)
        {
            markersArray[j].setAnimation(null);
        }
        this.setAnimation(google.maps.Animation.BOUNCE);
    });
    google.maps.event.addListener(markersArray[i], 'mouseover', function() {
        infohover.setContent(place.name);
        infohover.open(map, this);
    });
    google.maps.event.addListener(markersArray[i], 'mouseout', function() {
        infohover.close();
    });
}
function clearMarkers() {
    for (var i = 0; i < markersArray.length; i++) {
        if (markersArray[i]) {
            markersArray[i].setMap(null);
        }
    }
    markersArray = [];
}
function dropMarker(i) {
    return function() {
        if(markersArray[i])
            markersArray[i].setMap(map);
    };
}
function changeSpeed() {
    speedValue = (101 - document.getElementById("sliderSpeed").value) * 20;
}

function changeType(value, text, icon) {
    type=value;
    document.getElementById('spanTextType').innerHTML= text;
    document.getElementById('iconType').innerHTML= icon;
}

function changeLocationKind() {
    locationKind = document.querySelector('input[name="radioLocation"]:checked').value;
}

function allowEndFunc() {
    if(document.getElementById('switchDestination').checked == true)
        allowEnd=true;
    else
        allowEnd=false;
}

function addYourLocationButton(map, marker)
{
    var controlDiv = document.createElement('div');

    var firstChild = document.createElement('button');
    firstChild.style.backgroundColor = '#fff';
    firstChild.style.border = 'none';
    firstChild.style.outline = 'none';
    firstChild.style.width = '28px';
    firstChild.style.height = '28px';
    firstChild.style.borderRadius = '2px';
    firstChild.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    firstChild.style.cursor = 'pointer';
    firstChild.style.marginTop = '10px';
    firstChild.style.marginRight = '10px';
    firstChild.style.padding = '0px';
    firstChild.title = 'Your Location';
    controlDiv.appendChild(firstChild);

    var secondChild = document.createElement('div');
    secondChild.style.margin = '5px';
    secondChild.style.width = '18px';
    secondChild.style.height = '18px';
    secondChild.style.backgroundImage = 'url(https://maps.gstatic.com/tactile/mylocation/mylocation-sprite-1x.png)';
    secondChild.style.backgroundSize = '180px 18px';
    secondChild.style.backgroundPosition = '0px 0px';
    secondChild.style.backgroundRepeat = 'no-repeat';
    secondChild.id = 'you_location_img';
    firstChild.appendChild(secondChild);

    google.maps.event.addListener(map, 'dragend', function() {
        var myElement = document.querySelector("#you_location_img");
        myElement.style.backgroundPosition = "0px 0px";
    });
    firstChild.addEventListener('click', function() {
        var imgX = '0';
        var animationInterval = setInterval(function(){
            if(imgX == '-18') imgX = '0';
            else imgX = '-18';
            var myElement = document.querySelector("#you_location_img");
            myElement.style.backgroundPosition = imgX+"px 0px";
        }, 500);
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                myLocation=latlng;
                marker.setPosition(latlng);
                map.panTo(latlng);
                map.setZoom(12);
                secondChild.style.backgroundPosition = '-144px 0px';
                clearInterval(animationInterval);
                var myElement = document.querySelector("#you_location_img");
                myElement.style.backgroundPosition = "-144px 0px";
            });
        }
        else{
            clearInterval(animationInterval);
            var myElement = document.querySelector("#you_location_img");
            myElement.style.backgroundPosition = "0px 0px";
        }

    });

    controlDiv.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv);
}
function toggleBounce() {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function toggleBounceFound(foundmarker) {
    foundmarker.setAnimation(google.maps.Animation.BOUNCE);
}
/**
 * Created by mjnhthjen0912 on 24/04/2017.
 */
