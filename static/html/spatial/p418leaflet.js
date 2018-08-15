import {
    html,
    render
} from './src/js/lit-html/lit-html.js';

var map = L.map('map', {
    editable: true
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
map.setView([0, 0], 2);
map.editTools.startRectangle();

// var shades = new L.LeafletShades();
var shades = L.leafletShades();
shades.addTo(map);

function addLog(event, description) {
    var logger = document.getElementById('results');

    logger.innerHTML =
        "<p> <span class='event'>" + event + "</span>" +
        " <span class='description'>" + description + "</span> </p>"
    logger.scrollTop = logger.scrollHeight;
}

map.on("editable:vertex:dragend", function (e) {
    console.log(e);

    addLog(e.type, "updating rectangle drawing")
});

map.on("editable:drawing:commit", function (e) {
    console.log(e);
    addLog(e.type, "rectangle drawing finished")
});

map.on("moveend", function (e) {
    console.log(e);
    addLog(e.type, "map panned in/out or zoomed in/out")
});

shades.on("shades:bounds-changed", function (e) {
    console.log(e);
    var bounds = e.bounds
    console.log(bounds)
    addLog("bounds", bounds._northEast.lat)
});
