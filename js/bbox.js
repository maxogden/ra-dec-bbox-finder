var equatorial = require('equatorial')

var map, rsidebar, lsidebar, drawControl, drawnItems = null;

var currentmouse = L.latLng(0,0);

function formatBounds(bounds) {
    var formattedBounds = '';
    var southwest = bounds.getSouthWest();
    var northeast = bounds.getNorthEast();
    var xmin = 0;
    var ymin = 0;
    var xmax = 0;
    var ymax = 0;   
    xmin = southwest.lng.toFixed(6);
    ymin = southwest.lat.toFixed(6);
    xmax = northeast.lng.toFixed(6);
    ymax = northeast.lat.toFixed(6);

    var formattedBounds = xmin+','+ymin+','+xmax+','+ymax;

    return formattedBounds
}

function formatTile(point,zoom) {
    var xTile = Math.floor((point.lng+180)/360*Math.pow(2,zoom));
    var yTile = Math.floor((1-Math.log(Math.tan(point.lat*Math.PI/180) + 1/Math.cos(point.lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom));
    return xTile.toString() + ',' + yTile.toString();
}

function formatPoint(point) {
    var x = point.lng.toFixed(6)
    var y = point.lat.toFixed(6)
    var dec = equatorial.decDeg2Hms(point.lat)
    var ra = equatorial.raDeg2Hms(point.lng)
    var formattedBounds = [y,x].join(',')
    return formattedBounds
}

function validateStringAsBounds(bounds) {
    var splitBounds = bounds ? bounds.split(',') : null;
    return ((splitBounds !== null) &&
            (splitBounds.length == 4) &&
            ((-90.0 <= parseFloat(splitBounds[0]) <= 90.0) &&
             (-180.0 <= parseFloat(splitBounds[1]) <= 180.0) &&
             (-90.0 <= parseFloat(splitBounds[2]) <= 90.0) &&
             (-180.0 <= parseFloat(splitBounds[3]) <= 180.0)) &&
            (parseFloat(splitBounds[0]) < parseFloat(splitBounds[2]) &&
             parseFloat(splitBounds[1]) < parseFloat(splitBounds[3])))
}

$(document).ready(function() {
    window.map = L.mapbox.map('map').setView([0, 0], 3);
    
    var gSkyLayer = L.tileLayer('http://mw1.google.com/mw-planetary/sky/skytiles_v1/{x}_{y}_{z}.jpg', {
      attribution: 'Map tiles by Google'
    }).addTo(map)

    // Initialize the FeatureGroup to store editable layers
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Initialize the draw control and pass it the FeatureGroup of editable layers
    drawControl = new L.Control.Draw({
        draw: false,
        edit: {
            featureGroup: drawnItems,
            remove: false
        }
    });
    map.addControl(drawControl);

    /*
    **
    **  create bounds layer
    **  and default it at first
    **  to draw on null island
    **  so it's not seen onload
    **
    */
    startBounds = new L.LatLngBounds([0.0,0.0],[0.0,0.0]);
    var bounds = new L.Rectangle(startBounds,
        {
            fill : false,
            opacity : 1.0,
            color : '#000'
        }
    );
    bounds.on('bounds-set', function( e ) {
        // move it to the end of the parent
        var parent = e.target._container.parentElement;
        $( parent ).append( e.target._container ); 
        // Set the hash
        var southwest = this.getBounds().getSouthWest();
        var northeast = this.getBounds().getNorthEast();
        var xmin = southwest.lng.toFixed(6);
        var ymin = southwest.lat.toFixed(6);
        var xmax = northeast.lng.toFixed(6);
        var ymax = northeast.lat.toFixed(6);
        location.hash = ymin+','+xmin+','+ymax+','+xmax;
    });
    map.addLayer(bounds)
    
    map.on('draw:created', function (e) {
        drawnItems.addLayer(e.layer);
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').text(formatBounds(bounds.getBounds()));
        $('#boxboundsmerc').text(formatBounds(bounds.getBounds()));
        if (!e.geojson &&
            !((drawnItems.getLayers().length == 1) && (drawnItems.getLayers()[0] instanceof L.Marker))) {
            map.fitBounds(bounds.getBounds());
        } else {
            if ((drawnItems.getLayers().length == 1) && (drawnItems.getLayers()[0] instanceof L.Marker)) {
                map.panTo(drawnItems.getLayers()[0].getLatLng());
            }
        }
    });
    
    map.on('draw:edited', function (e) {
        bounds.setBounds(drawnItems.getBounds())
        $('#boxbounds').text(formatBounds(bounds.getBounds()));
        $('#boxboundsmerc').text(formatBounds(bounds.getBounds()));
        map.fitBounds(bounds.getBounds());
    });
    
    function display() {
        $('.zoomlevel').text(map.getZoom().toString());
        $('.tilelevel').text(formatTile(new L.LatLng(0, 0),map.getZoom()));
        $('#mapbounds').text(formatBounds(map.getBounds()));
        $('#mapboundsmerc').text(formatBounds(map.getBounds()));
        $('#center').text(formatPoint(map.getCenter()))
        $('#centermerc').text(formatPoint(map.getCenter()))
        $('#boxbounds').text(formatBounds(bounds.getBounds()));
        $('#boxboundsmerc').text(formatBounds(bounds.getBounds()));
        $('#mousepos').text(formatPoint(new L.LatLng(0, 0)));
        $('#mouseposmerc').text(formatPoint(new L.LatLng(0, 0)));
    }
    display();

    map.on('mousemove', function(e) {
        currentmouse.lat = e.latlng.lat;
        currentmouse.lng = e.latlng.lng;
        $('.tilelevel').text(formatTile(e.latlng,map.getZoom()));
        $('#mousepos').text(formatPoint(e.latlng));
        $('#mouseposmerc').text(formatPoint(e.latlng));
        $('#mapbounds').text(formatBounds(map.getBounds()));
        $('#mapboundsmerc').text(formatBounds(map.getBounds()));
        $('#center').text(formatPoint(map.getCenter()));
        $('#centermerc').text(formatPoint(map.getCenter()));
    });
    map.on('zoomend', function(e) {
        $('.tilelevel').text(formatTile(currentmouse,map.getZoom()));
        $('.zoomlevel').text(map.getZoom().toString());
        $('#mapbounds').text(formatBounds(map.getBounds()));
        $('#mapboundsmerc').text(formatBounds(map.getBounds()));
    });
    
    var initialBBox = location.hash ? location.hash.replace(/^#/,'') : null;
    if (initialBBox) {
        if (validateStringAsBounds(initialBBox)) {
            var splitBounds = initialBBox.split(',');
            startBounds = new L.LatLngBounds([splitBounds[0],splitBounds[1]],
                                             [splitBounds[2],splitBounds[3]]);
            var lyr = new L.Rectangle( startBounds );    
            var evt = {
                layer : lyr,
                layerType : "polygon",
            } 
            map.fire( 'draw:created', evt );
            //map.fitBounds(bounds.getBounds());
        } else {
            // This will reset the hash if the original hash was not valid
            bounds.setBounds(bounds.getBounds());
        }
    } else {
        // Initially set the hash if there was not one set by the user
        bounds.setBounds(bounds.getBounds());
    }

    $("input").click(function(e) {
        display();
    });

});

