var equatorial = require('equatorial')
var map, rsidebar, lsidebar, drawControl, drawnItems = null
var currentmouse = L.latLng(0,0)

/*
**
** monkeypatch L.Rectangle 
** to fire an event after setting
**
** the base parent object L.Path
** includes the L.Mixin.Events
**
** ensures bbox box is always
** the topmost SVG feature
**
*/
L.Rectangle.prototype.setBounds = function (latLngBounds) {
  this.setLatLngs(this._boundsToLatLngs(latLngBounds))
  this.fire( 'bounds-set' )
}

function formatBounds(bounds) {
  var southwest = bounds.getSouthWest()
  var northeast = bounds.getNorthEast()
  var xmin = (southwest.lng + 180).toFixed(6)
  var ymin = southwest.lat.toFixed(6)
  var xmax = (northeast.lng + 180).toFixed(6)
  var ymax = northeast.lat.toFixed(6)
  var fmt = $("input[name='coord-format']:checked").val()
  if (fmt === 'hms') {
    xmin = equatorial.raDeg2Hms(southwest.lng + 180, true)
    ymin = equatorial.decDeg2Hms(southwest.lat, true)
    xmax = equatorial.raDeg2Hms(northeast.lng + 180, true)
    ymax = equatorial.decDeg2Hms(northeast.lat, true)
  }
  return [xmin, ymin, xmax, ymax].join(',')
}

function formatPoint(point) {
  var x = point.lng + 180
  var y = point.lat
  var fmt = $("input[name='coord-format']:checked").val()
  if (fmt === 'hms') {
    x = equatorial.raDeg2Hms(point.lng + 180, true)
    y = equatorial.decDeg2Hms(point.lat, true)
  }
  var formattedBounds = [x,y].join(',')
  return formattedBounds
}

function validateStringAsBounds(bounds) {
  var splitBounds = bounds ? bounds.split(',') : null
  return ((splitBounds !== null) &&
    (splitBounds.length == 4) &&
    ((-90.0 <= parseFloat(splitBounds[1]) <= 90.0) &&
      (-180.0 <= parseFloat(splitBounds[0]) - 180 <= 180.0) &&
      (-90.0 <= parseFloat(splitBounds[3]) <= 90.0) &&
      (-180.0 <= parseFloat(splitBounds[2]) - 180 <= 180.0)) &&
    (parseFloat(splitBounds[0]) < parseFloat(splitBounds[2]) &&
      parseFloat(splitBounds[1]) < parseFloat(splitBounds[3])))
}

$(document).ready(function() {
  window.map = L.mapbox.map('map').setView([0, 0], 1)
  
  var gSkyLayer = L.tileLayer('http://mw1.google.com/mw-planetary/sky/skytiles_v1/{x}_{y}_{z}.jpg', {
    attribution: 'Map tiles by Google'
  }).addTo(map)

  // Initialize the FeatureGroup to store editable layers
  drawnItems = new L.FeatureGroup()
  map.addLayer(drawnItems)
  
  // Initialize the draw control and pass it the FeatureGroup of editable layers
  drawControl = new L.Control.Draw({
    draw: false,
    edit: {
      featureGroup: drawnItems,
      remove: false
    }
  })
  map.addControl(drawControl)

  startBounds = new L.LatLngBounds([-90,-180],[90,180])
  
  var bounds = new L.Rectangle(startBounds, {
    fill : false,
    opacity : 1.0,
    color : '#000'
  })
  
  bounds.on('bounds-set', function( e ) {
    // move it to the end of the parent
    var parent = e.target._container.parentElement
    $( parent ).append( e.target._container ) 
    // Set the hash
    var southwest = this.getBounds().getSouthWest()
    var northeast = this.getBounds().getNorthEast()
    var xmin = (southwest.lng + 180).toFixed(6)
    var ymin = southwest.lat.toFixed(6)
    var xmax = (northeast.lng + 180).toFixed(6)
    var ymax = northeast.lat.toFixed(6)
    location.hash = xmin+','+ymin+','+xmax+','+ymax
  })
  map.addLayer(bounds)
  
  map.on('draw:created', function (e) {
    drawnItems.addLayer(e.layer)
    bounds.setBounds(drawnItems.getBounds())
    $('#boxbounds').text(formatBounds(bounds.getBounds()))
    $('#boxboundsmerc').text(formatBounds(bounds.getBounds()))
  })
  
  map.on('draw:edited', function (e) {
    bounds.setBounds(drawnItems.getBounds())
    $('#boxbounds').text(formatBounds(bounds.getBounds()))
    $('#boxboundsmerc').text(formatBounds(bounds.getBounds()))
    map.fitBounds(bounds.getBounds())
  })
  
  function display() {
    $('.zoomlevel').text(map.getZoom().toString())
    $('#mapbounds').text(formatBounds(map.getBounds()))
    $('#mapboundsmerc').text(formatBounds(map.getBounds()))
    $('#center').text(formatPoint(map.getCenter()))
    $('#centermerc').text(formatPoint(map.getCenter()))
    $('#boxbounds').text(formatBounds(bounds.getBounds()))
    $('#boxboundsmerc').text(formatBounds(bounds.getBounds()))
    $('#mousepos').text(formatPoint(new L.LatLng(0, 0)))
    $('#mouseposmerc').text(formatPoint(new L.LatLng(0, 0)))
  }
  display()

  map.on('mousemove', function(e) {
    currentmouse.lat = e.latlng.lat
    currentmouse.lng = e.latlng.lng
    $('#mousepos').text(formatPoint(e.latlng))
    $('#mouseposmerc').text(formatPoint(e.latlng))
    $('#mapbounds').text(formatBounds(map.getBounds()))
    $('#mapboundsmerc').text(formatBounds(map.getBounds()))
    $('#center').text(formatPoint(map.getCenter()))
    $('#centermerc').text(formatPoint(map.getCenter()))
  })
  map.on('zoomend', function(e) {
    $('.zoomlevel').text(map.getZoom().toString())
    $('#mapbounds').text(formatBounds(map.getBounds()))
    $('#mapboundsmerc').text(formatBounds(map.getBounds()))
  })
  
  var initialBBox = location.hash ? location.hash.replace(/^#/,'') : null
  if (initialBBox) {
    if (validateStringAsBounds(initialBBox)) {
      var splitBounds = initialBBox.split(',')
      startBounds = new L.LatLngBounds(
        [splitBounds[1], splitBounds[0] - 180],
        [splitBounds[3], splitBounds[2] - 180]
      )
      createBox(startBounds)
      setTimeout(function() {
        map.fitBounds(drawnItems.getBounds())
      }, 100)
    } else {
      // This will reset the hash if the original hash was not valid
      createBox(startBounds)
    }
  } else {
    // Initially set the hash if there was not one set by the user
    createBox(startBounds)
  }
  
  function createBox(bds) {
    var lyr = new L.Rectangle( bds )  
    var evt = {
      layer : lyr,
      layerType : "polygon",
    } 
    map.fire( 'draw:created', evt )
  }

  $("input").click(function(e) {
    display()
  })

})
