// TODO move to b-map
;var debug = true,
	markers = [], //markers object
	lights = [],
	route = false, //diable traffic layer
	traffic, //traffic layer
	map = new L.map($('.b-map').get(0), {minZoom: 1, maxZoom: 17}).setView([37.983972,23.727806], 17), //map object
	state = {
		traffic: false, //traffic layer flag
		informer: false, //traffic informer flag
		route: false //routing enabled flag
	}; //main state onject
	
	
L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{ maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'] }).addTo(map);

traffic = L.tileLayer('https://maps.googleapis.com/maps/vt?pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i411111038!2m52!1e2!2sspotlight!4m2!1sgid!2sOlmE_yV_u0OQizAUksawKA!8m46!1m8!12m7!10b0!12splaceholder!19m3!1b0!2zNSw2LDExLDI0LDQ1LDc1LDkzLDEwMSwxNTM!3s0x0%3A0x3d44d6cc5757cf4c!20e1!2m7!1s0x46b54afc73d4b0c9%3A0x3d44d6cc5757cf4c!2z0JzQvtGB0LrQstCwLCDQoNC-0YHRgdC40Y8!4m2!3d55.755826!4d37.6172999!5e1!6b1!11e1!12m6!3m1!3s0x46b52c9d0367d71d%3A0xe6dde8c2b56370!3m1!3s0x46b5350a4bc3a26d%3A0xcab148900f83049a!3m1!3s0x46b54a0c75db79b5%3A0xcad4b72bc2b4dc48!13m10!2shh%2Chplexp%2Ca!18m4!5b0!6b0!8b0!9b0!22m3!6e2!7e3!8e2!19u6!19u7!19u11!19u12!19u14!19u20!19u29!19u30!20m1!1e6!2m9!1e2!2straffic!3i999999!4m2!1sincidents!2s1!4m2!1sincidents_text!2s1!3m8!2sru!3s!5e1105!12m4!1e68!2m2!1sset!2sRoadmapMuted!4e0!5m1!1e0!23i4111425').addTo(map);

function centerByMarker() {
	map.setView(this.getLatLng(), map.getZoom());
	// center offset trick by result
	if (sresult.is(':visible')) map.panBy([-170, 0]);
	if (debug) console.log('centerByMarker():', this);
}

function centerByFound() {
	var coords = markers[ $(this).data('marker') ].openPopup().getLatLng();
	map.setView( coords, map.getZoom() );
	// center offset trick by result
	if (sresult.is(':visible')) map.panBy([-170, 0]);
	if (debug) console.log('centerByFound():', this, coords);
}

function cleanUpResults() {
	cleanUpFound();
	cleanUpMarkers();
	cleanUpRoutes();
}

function cleanUpFound() {
	sfound.html('').hide()
}

function cleanUpMarkers() {
	for (i in markers) {
	    map.removeLayer(markers[i]);
	}
	markers = [];
	if (debug) console.log('cleanUpMarkers(): ', markers);
}
function cleanUpLightsMarkers() {
	for (i in lights) {
	    map.removeLayer(lights[i]);
	}
	lights = [];	
}

// TODO move to b-controls
var bsearch   =  $('.b-search'),
	brouting  =  $('.b-route'),
	csearch   =  $('.b-switch__button_type_address').click(enableSearch),
	croutes   =  $('.b-switch__button_type_route').click(enableRouting);


function enableSearch () {
	if (bsearch.not(':visible')) {
		csearch.addClass('b-switch__button_state_current').siblings().removeClass('b-switch__button_state_current');
		brouting.hide();
		bsearch.show();
	}
}

function enableRouting () {
	if (brouting.not(':visible')) {
		croutes.addClass('b-switch__button_state_current').siblings().removeClass('b-switch__button_state_current');
		bsearch.hide();
		brouting.show();
	}
}

function cleanUpRoutes() {
	if (route.line != undefined) map.removeLayer(route.line);
	if (route.start != undefined) map.removeLayer(route.start);
	if (route.end != undefined) map.removeLayer(route.end);
	route = false;
	if (debug) console.log('cleanUpRoutes(): ', route);
}


// TODO move to b-search
var sbutton   =  $('.b-search__submit').click(search),
	sinput    =  $('.b-search__input'),
	bounds 	  =  map.getBounds(),
	center    = map.getCenter(),
	autocompleteOptions = {
		serviceUrl: 'http://api.geonames.org/searchJSON', 
		paramName: 'q',
		dataType: 'json',
		params: {
			south: bounds._southWest.lat, 
			north: bounds._northEast.lat,
			west: bounds._southWest.lng,
			east: bounds._northEast.lng,
			maxRows: 10,
			username: 'mamyashev',
			searchlang: 'en',
			lat: center.lat, 
			lon: center.lng
		},
		transformResult: function(r) {
			if (r.totalResultsCount > 0) {
				return {
					suggestions: $.map(r.geonames, function(dataItem) {
						return { 
							value: dataItem.name, 
							data: dataItem 
						};
					})
				};
			}
		},
		onSelect: function(r) {
			// $(this).attr('data-coords', r.data.coord)
			var _m = L.marker([r.data.lat, r.data.lng]).addTo(map).on('click', centerByMarker).bindPopup(r.name);
			markers[this.id] = _m;
			map.setView(_m.getLatLng(), map.getZoom());
		}
	};
sinput.autocomplete(autocompleteOptions);
	
// Search section
function search(e) {
	var resultsCount = 10,
		bounds = map.getBounds(), //@deprecated
		center = map.getCenter(),
		string = sinput.val();
	e.stopPropagation();
	e.preventDefault();
		
	if (debug) {
		console.log('map.getBounds():', bounds); //@deprecated
		console.log('map.getCenter():', center);
	}
	if (string == '' || string.length<36) {
		alert('Enter the address!');
		return;
	}
	
	//TODO try this one https://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=bakery+in+berlin+wedding&format=json&limit=1
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'http://api.geonames.org/searchJSON', 
		data: {
			q: string, 
			south: bounds._southWest.lat, 
			north: bounds._northEast.lat,
			west: bounds._southWest.lng,
			east: bounds._northEast.lng,
			maxRows: 10,
			username: 'mamyashev',
			searchlang: 'en',
			lat: center.lat, 
			lon: center.lng
		},
		beforeSend: function(){
			lwait.show();
		}
	}).done(function(r){
		if (r.totalResultsCount > 0) {
			cleanUpResults();
			var _inj = $('<ul/>').attr({'class': 'b-found'}),
			_boundCoords = [];
				
			for (i=0; i<resultsCount; i++) {
				var _o = r.geonames[i],
					_crds = [_o.lat, _o.lng];
				_boundCoords.push(_crds);
				markers[i] = L.marker(_crds).addTo(map).on('click', centerByMarker).bindPopup(_o.name);
				$('<li/>')
					.attr({'data-marker': i, 'class': 'b-found__item' })
					.text(_o.name)
					.click(centerByFound)
					.appendTo(_inj);
			}
			bounds = new L.LatLngBounds(_boundCoords);
			map.fitBounds(bounds);
		} else {
			var _inj = $('<p/>').text('Nothing found');
		}
		sfound.html(_inj).show();
		// center offset trick by result
		map.panBy([-170, 0]); 
		console.log('panned by -170')
	}).fail(function() { 
		if (debug) console.log('Search ajax ERROR!');
	}).always(function(r) { 
		if (sresult.not(':visible')) {
			sresult.show('slow');
			sunderlay.show('slow');
		}
		lwait.hide();
		if (debug) console.log('Search $.ajax.always(): ', r);
	});	
}


// TODO move to b-route
var rfrom = $('.b-route__from'),
	rto = $('.b-route__to'),
	rbutton = $('.b-route__submit').click(routing),
	rmaneuvres = [
		'straihght',
		'lefter',
		'left',
		'hard left',
		'righter',
		'right',
		'hard right',
		'turn around',
		'roundabout',
		'turn left',
		'turn right'
	],
	icon = L.icon({
	    iconUrl: '_/i/circle.svg',
	 	iconAnchor: [10, 10],
	});
// console.log(autocompleteOptions)
rfrom.autocomplete(autocompleteOptions);
rto.autocomplete(autocompleteOptions);

// Routing section
function routing(e) {
	var from = rfrom.val(),
		to = rto.val(),
		counter = 0,
		center = map.getCenter(),
		coords = {
			from: '',
			to: ''
		};
	if (e) {
		e.stopPropagation();
		e.preventDefault();
	}
	if (from == '' || from.length < 4) {
		state.route = false;
		alert('Enter destination point!');
		return;
	}
	if (to == '' || to.length < 4) {
		state.route = false;
		alert('Enter the start point!');
		return;
	}
	state.route = true; //[from, to];
	
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'http://search2.tmcrussia.com/',
		data: {
			a: 'georoute',
			q1: from,
			q2: to,
			gn: 2,
			type: 'route,plan,indexes',
			method: 'optimal',
			traffic: (state.traffic == true) ? 1 : 0,
			z: map.getZoom(),
			um: true
		},
		beforeSend: function() {
			lwait.show();
		}
	}).done(function(r) {
		var _points = r.res.route.points,
			_time = new Date(1970, 1, 1, 0, 0, parseInt(r.res.route.time), 0)
					.toTimeString()
					.replace(/^(\d{2}):(\d{2}):(\d{2}).*/, "$1:$2 min")
					.replace(/^00:(.*)/, "$1"),
			_distance = (r.res.route.distance/1000)
						.toString()
						.replace(/(\d+).(\d+)/, "$1км $2м")
						.replace(/^0км (.*)/, "$1"),
			_plan = r.res.route.plan,
			_inj = $('<div/>', {
				'class': 'b-meta',
				html: $('<div/>',{
						'class': 'b-meta__time',
						text: 'Time of trip: ' + _time
					}).add($('<div/>',{
						'class': 'b-meta__distance',
						text: 'Distance: ' + _distance
					}))
			}),
			_injPlan = $('<ul/>').attr({'class': 'b-found'}),
			_st = r.res.search[0][0].matches[0],
			_fn = r.res.search[1][0].matches[0],
			_r = [],
			_p = [],
			bounds, ne, sw;
		cleanUpResults(); // state.route == true ? true : false 

		// reverse  shit
		for (var i = 0; i < _points.length; i++) {
			_r.push([_points[i][1], _points[i][0]]);
		}
		//end of freverse
		
		for (var i = 0; i < _plan.length; i++) {
			if (_plan[i]['name'] != '') {
				var _crds = [_plan[i].from[1], _plan[i].from[0]];
				if (i!=0 && i!=_plan.length) {
					markers[i] = L.marker(_crds, {icon: icon}).addTo(map).on('click', centerByMarker).bindPopup(_plan[i]['name']);
				}
				
				$('<li/>', {
					'data-marker': i, 
					'class': 'b-found__item',
					html: $('<div/>',{
						'class': 'b-found__item_sprite_routing b-found__item_dir_' + _plan[i]['dir'],
						html: '&nbsp;'
					}),
					click: centerByFound
				})
				.append(_plan[i]['name'])
				.appendTo(_injPlan);
			}
		}
		route = {
			start: L.marker([_st.y, _st.x]).addTo(map).on('click', centerByMarker).bindPopup(_st.addr),
			end: L.marker([_fn.y, _fn.x]).addTo(map).on('click', centerByMarker).bindPopup(_fn.addr),
			line: L.polyline(_r, {
				color: 'purple',
				stroke: true 
			}).addTo(map)
		}
		
		/* check this OUT! diff behaviour */
		bounds = route.line.getBounds();
		//start bar excluding trick
		ne = map.project(bounds.getNorthEast());
		ne.y -= 80; //bar offset
		sw = map.project(bounds.getSouthWest());
		sw.x -= 160; //result offset
		ne = map.unproject(ne);
		sw = map.unproject(sw)
		bounds = new L.LatLngBounds(sw, ne);
		//end bar excluding trick
		map.fitBounds(bounds);

		sfound.html(_inj);
		_injPlan.insertAfter(_inj);
		sfound.show()
		
	}).fail(function() {
		if (debug) console.log('ROUTE ajax ERROR!');
	}).always(function(r) {
		if (sresult.not(':visible')) {
			sresult.show('slow');
			sunderlay.show('slow');
		}
		lwait.hide();
		if (debug) console.log('ROUTE $.ajax.always(): ', r);
	});
}
	

// TODO move to b-traffic 
var ctraffic  =  $('.b-informers__traffic').click(enableTraffic),
	lwait     =  $('.b-wait'),
	ltrafficn =  $('.b-informers__traffic-color'),
	ltraffic  =  $('.b-informers__traffic-ball');
// muahahahaha ;)
enableTraffic();
	
function enableTraffic () {
	if (state.traffic == false) {
		state.traffic = true;
		map.addLayer(traffic);
		state.informer = setInterval(updateTrafficInformer, 60000);
		updateTrafficInformer();
	} else {
		state.traffic = false;
		map.removeLayer(traffic);
		clearInterval(state.informer);
		ltrafficn.css({background: '#666', color: '#fff'}).text('—');
		ltraffic.text('Пробки');
	}
	if (state.route != false && brouting.is(':visible') == true) {
		routing();
	}
	if (debug) console.log('enableTraffic(): state.traffic =', state.traffic);
}
function updateTrafficInformer () {
	var bounds = map.getBounds();
	traffic.redraw();
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'http://traffic.tmcrussia.com', 
		data: {
			lon1: bounds._southWest.lng, 
			lat1: bounds._southWest.lat, 
			lon2: bounds._northEast.lng, 
			lat2: bounds._northEast.lat,
			z: map.getZoom()
		}
	}).done(function(r){
		if( r.city != undefined ) {
			var point = r.city.Mark, 
				min	  = Math.floor(r.updated_utc / 60),
				color;
			switch(point) {
				case '0':
				case '1':
				case '2':
				case '3':
					color = 'green';
					break;
				case '4':
				case '5':
					color = 'yellow';
					break;
				default:
					color = 'red';
					break;
			}
			ltrafficn.css({background: color, color: '#000'}).text(point);
			ltraffic.text(point=='1' ? 'point' : (point>4 ? 'points' : 'points'));
		}
	}).fail(function() { 
		if (debug) console.log('Jams ajax ERROR!');
	}).always(function(r) { 
		if (debug) console.log('Jams $.ajax.always(): ', r);
	});	
}

/* 
 * TODO move to b-location 
 */
$('.b-location').click(function(){
	if (navigator.geolocation){
		lwait.show();
		navigator.geolocation.getCurrentPosition(function (position) {
			coords = [position.coords.latitude, position.coords.longitude];
			map.setView(coords, 17);
			markers['geolocation'] = L.marker(coords).addTo(map).on('click', centerByMarker).bindPopup('Вы здесь');
			if (rfrom.val() == '') {
				reverseGeocode(coords, function(r){
					if (debug) console.log(r)
					rfrom.val(r.res[0].addr);
				});
			}
			lwait.hide();
			if (debug) console.log('Coordinates: ', coords);
		}, function(){ alert('Geocoding error!'); });
	} else { 
		alert("Geolocation is not supported by your browser!");
	}
});

/* 
 * TODO move to b-result 
 */
var sresult   =  $('.b-result'),
	sunderlay =  $('.b-result__underlay'),
	sclose    =  $('.b-result__close').click(closeResults),
	sfound    =  $('.b-result__found');
	
function closeResults(e) {
	cleanUpResults();
	if (e) e.stopPropagation();
	sresult.hide('slow');
	sunderlay.hide('slow');
	// center offset trick by result
	map.panBy([170, 0]);
}

/*
 *  OSM traffic lights 
 */
var iconb64 = 'data:image/png;base64,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'

var icon = L.icon({
	iconUrl: iconb64,
	iconSize: [20, 20]
});

function redrawLights () {
	var lightsBbox = map.getBounds();
	if (markers.length>0) 
		cleanUpLightsMarkers();
	for(i in _osm_traffic_lights) {
		var _c = _osm_traffic_lights[i].coordinates,
			_l = L.latLng(_c[1], _c[0]);
		if (lightsBbox.contains(_l) == true)
			lights.push(L.marker(_l, {icon: icon}).addTo(map).on('click', centerByMarker).bindPopup(_c[1]+', '+_c[0]));
	
	}
}
redrawLights();

map.on('moveend', redrawLights);
map.on('zoomend', redrawLights);