require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"equatorial":[function(require,module,exports){
module.exports.raDeg2Hms = function(ra) {
  var prefix = ''
  var deg = +ra
  if (deg < 0) {
    prefix = '-'
    deg = Math.abs(deg)
  }
  var hour = Math.floor(deg / 15)
  var min = Math.floor(((deg / 15) - hour) * 60)
  var sec = ((((deg / 15) - hour) * 60) - min) * 60
  return prefix + [hour, min, sec].join(':')  
}

module.exports.decDeg2Hms = function(dec) {
  var prefix = ''
  var deg = +dec
  if (deg < 0) {
    prefix = '-'
    deg = Math.abs(deg)
  }
  var hour = Math.floor(deg)
  var min = Math.abs(Math.floor((deg - hour) * 60))
  var sec = (Math.abs((deg - hour) * 60) - min) * 60
  return prefix + [hour, min, sec].join(':')
}

module.exports.raHms2Deg = function(ra) {
  var parts = ra.split(':')
  var sign = 1
  var h = parseFloat(parts[0])
  var m = parseFloat(parts[1])
  var s = parseFloat(parts[2])
  if (h.toString()[0] === '-') {
    sign = -1
    h = Math.abs(h)
  }
  deg = (h * 15) + (m / 4) + (s / 240)
  return deg * sign
}

module.exports.decHms2Deg = function(dec) {
  var parts = dec.split(':')
  var sign = 1
  var d = parseFloat(parts[0])
  var m = parseFloat(parts[1])
  var s = parseFloat(parts[2])
  if (d.toString()[0] === '-') {
    sign = -1
    d = Math.abs(d)
  }
  var deg = d + (m / 60) + (s / 3600)
  return deg * sign
}
},{}]},{},[]);
