$(function(){

	var logo = $('#logo'),
		logoText = $('#logo-text'),
		underlay = $('#background').css({ opacity: 0.4 }),
		main = $('#main'),
		footer = $('footer'),
		currentSection,
		animating = false,
		hash = window.location.hash;

	$('footer a').click(function(e){
		$.scrollTo($(this).attr('href'), 800);
		e.preventDefault();
	});

	$('#landing').parallax(-503, -394, 0.1, true);
	$('#about').parallax(-266, -450, 0.1, true);
	$('#events').parallax(-511, -572, 0.1, true);
	$('#lagoon').parallax(-511, -572, 0.1, true);
	$('#resources').parallax(-511, -572, 0.1, true);

	function collapseLogo(){
		if(logo.is(':visible')){
			animating = true;
			logo.fadeOut();
			logoText.animate({ top: [14, 'swing'] }, function(){
				$('footer').animate({ height: 120 }, function(){ animating = false; });
			});	
		}
	};
	
	function expandLogo(){
		if(!logo.is(':visible')){
			animating = true;
			$('footer').animate({ height: 196 }, function(){
				logoText.animate({ top: [85, 'swing'] }, function(){ animating = false; });
				logo.fadeIn();
			});
		}	
	};

	$(window).scroll( function(){
		if(animating){
			return;
		}
		
		if($(window).scrollTop() > 100){
			collapseLogo();
		}
		else{
			expandLogo();
		}
	});
		
	// BEGIN Map Script
	
	var center = new google.maps.LatLng(42.601539,-83.356112),
			map = new google.maps.Map($('#lagoon-map')[0], {
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.SATELLITE,
			center: center,
			zoom: 19,
			mapTypeControl: false,
			panControl: false,
			streetViewControl: false,
			zoomControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT }
		}),
		markers = {},
		markerData = {},
		visibleDock;
	
	$.each(window.hha.coords, function(label, coord){
		var pos = new google.maps.LatLng(coord.lat, coord.long),
			marker = new google.maps.Marker({
				map: map,
				icon: 'images/map-marker.png',
				title: label,
				draggable: true,
				position: pos,
				clickable: false
			});
		markerData[label] = marker;
	
		google.maps.event.addListener(marker, 'dragend', function(e){
			marker.setPosition(pos);
		});
	});  
	
	google.maps.event.addListener(map, 'dragend', mapMarkerAction);
	
	google.maps.event.addListener(map, 'tilesloaded', function(){ 
		mapMarkerAction();
	});
	
	google.maps.event.addListener(map, 'resize', function(){
		setTimeout(function(){ map.setCenter(center); }, 200);
	});
	
	// tilesloaded is too quick to trigger on page load, and before the markers are added.
	// and googles api provides no 'markers added' event. old school listening...
	var markersAdded = setInterval(function(){
		var imgs = $('img[src$="map-marker.png"]');
		
		if(!imgs.length){
			return;
		}
		
		clearInterval(markersAdded);
		
		var side = 'a',
			labels = $.map(window.hha.coords, function(what, label){
				return label;
			});

		imgs.parent().each(function(index, e){
			if((index + 1) > labels.length){
				return false;
			}

			var div = $(this);				
			markers[labels[index]] = div;
			
			if(div.find('.maplabel').length){
				return;
			}
			div.append('<div class="maplabel">' + labels[index] + '</div>');
		});
	}, 100);
	
	$.each(window.hha.lagoon, function(streetName, street){
	
		var numbers = street.sort(function(a, b){
			return a.number - b.number;
		});
	
		$.each(numbers, function(index, item){
			var list = $('#legend #list-' + streetName),
				street = item.number;
	
			$('<li></li>')
				.append('<a href="#" data-number="' + street + '" data-dock="' + item.dock + '" title="' + street + ' ' + list.prev().html() + ' - ' + item.dock + '">' + street + '</a>')
				.find('a').click(function(e){
					var dock = $(this).data('dock');
					
					e.preventDefault();
					hideMarkers(dock);

					visibleDock = dock;
					markers[dock].stop().fadeIn();
					map.setCenter(markerData[dock].position);
				})
				.parent()
				.appendTo(list);
		});
	});
	
	$('#legend h2').each(function(){
			var e = $(this);
			e.attr('title', 'Show all docks for ' + e.html())
		})
		.click(function(){
			visibleDock = $.map($(this).next().find('a').get(), function(a, index){
				return $(a).data('dock');
			});
			showDocks(visibleDock);
		});
	
	$('nav a[href=#lagoon]').click(function(){
		setTimeout(function(){
			google.maps.event.trigger(map, 'resize');
		}, 500);
	});
	
	function hideMarkers(showDock, noFade){
		$.each(markers, function(dock, marker){
			if(this == markers[showDock]){
				return;
			}
			if(noFade){
				this.stop().hide();
			}
			else{
				this.stop().fadeOut();
			}
		});
	};
	
	function showDocks(docks){
		hideMarkers();
		$.each(docks, function(){
			markers[this].stop().fadeIn();
		});
	};
	
	function mapMarkerAction(){
		if(visibleDock){
			if($.isArray(visibleDock)){
				showDocks(visibleDock);
			}
			else{
				hideMarkers(visibleDock);
			}
		}    
	};	
});
