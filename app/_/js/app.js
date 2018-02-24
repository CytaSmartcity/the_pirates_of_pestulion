// TODO move to b-app
;var debug = true,
	markers = {}, //markers object
	route = false, //diable traffic layer
	traffic, //traffic layer
	map = new L.map($('.b-map').get(0), {minZoom: 1, maxZoom: 17}).setView([37.983972,23.727806], 9), //map object
	state = {
		traffic: false, //traffic layer flag
		informer: false, //traffic informer flag
		route: false //routing enabled flag
	}; //main state onject
	
	
L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

traffic = L.tileLayer('https://maps.googleapis.com/maps/vt?pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i411111038!2m52!1e2!2sspotlight!4m2!1sgid!2sOlmE_yV_u0OQizAUksawKA!8m46!1m8!12m7!10b0!12splaceholder!19m3!1b0!2zNSw2LDExLDI0LDQ1LDc1LDkzLDEwMSwxNTM!3s0x0%3A0x3d44d6cc5757cf4c!20e1!2m7!1s0x46b54afc73d4b0c9%3A0x3d44d6cc5757cf4c!2z0JzQvtGB0LrQstCwLCDQoNC-0YHRgdC40Y8!4m2!3d55.755826!4d37.6172999!5e1!6b1!11e1!12m6!3m1!3s0x46b52c9d0367d71d%3A0xe6dde8c2b56370!3m1!3s0x46b5350a4bc3a26d%3A0xcab148900f83049a!3m1!3s0x46b54a0c75db79b5%3A0xcad4b72bc2b4dc48!13m10!2shh%2Chplexp%2Ca!18m4!5b0!6b0!8b0!9b0!22m3!6e2!7e3!8e2!19u6!19u7!19u11!19u12!19u14!19u20!19u29!19u30!20m1!1e6!2m9!1e2!2straffic!3i999999!4m2!1sincidents!2s1!4m2!1sincidents_text!2s1!3m8!2sru!3s!5e1105!12m4!1e68!2m2!1sset!2sRoadmapMuted!4e0!5m1!1e0!23i4111425').addTo(map);

function centerByMarker() {
	map.setView(this.getLatLng(), map.getZoom());
	// center offset trick by result
	if (sresult.is(':visible')) map.panBy([-170, 0]);
	if (debug) console.log('centerByMarker():', this);
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


//TODO move to b-location
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

