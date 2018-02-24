/* GLOBALS */ 
var debug = true,
	markers = {}, //markers object
	route = false, //diable traffic layer
	traffic, //traffic layer
	map = new L.map($('.b-map').get(0), {minZoom: 1, maxZoom: 17}).setView([37.983972,23.727806], 9), //map object
	state = {
		traffic: false, //traffic layer flag
		informer: false, //traffic informer flag
		route: false //routing enabled flag
	}; //main state onject