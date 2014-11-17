$(function(){

	var logo = $('#logo'),
		logoText = $('#logo-text'),
		underlay = $('#background').css({ opacity: 0.4 }),
		main = $('#main'),
		footer = $('footer'),
		currentSection,
		prevIndex = 0,
		pause = false,
		hash = window.location.hash;

	logoText.click(function(){
		$('footer').animate({ height: 196 }, function(){
			logoText.animate({ top: [85, 'swing'] });
			logo.fadeIn();
			
			pause = false;
		});
		
		var section = $('#start');
		
		$('#main section:visible').stop().fadeOut();		
		underlay.stop().animate({ opacity: 0.9 });
	});

	$('nav a').click(function(e){
		var section = $('#' + $(this).data('section')),
			visible = $('#main section:visible');
		
		pause = true;
		
		logo.fadeOut();
		logoText.animate({ top: [14, 'swing'] }, function(){
			$('footer').animate({ height: 120 });
		});
		
		underlay.stop().animate({ opacity: 0 });
		
		if(visible.length){
			visible.stop().fadeOut(function(){
				$(this).hide(); // ensures no scroll bar
				section.fadeIn();
			});
		}
		else{
			section.fadeIn();
		}
	});
	
	$('.content aside li a').click(function(evnt){
		var e = $(this),
			pages = e.closest('.content').find('.page-container'),
			page = pages.find('.page.' + e.data('page')),
			index = pages.find('.page').index(page);
		
		pages.animate({ marginLeft: [-(page.outerWidth() * index), 'swing'] });
		
		e.parent().addClass('active').siblings().removeClass('active');
		
		evnt.preventDefault();
	});
	
	function rotate(i){

		var index = i,
			img = new Image();	
		
		if(isNaN(index)){

			if(pause){
				return;
			}		
		
			index = prevIndex;
			while(index == prevIndex){
				index = Math.floor((Math.random()*9)+1) - 1;
			};
		};

		prevIndex = index;
		
		img.onload = function(){
			
			hash = window.location.hash;
			
			underlay.animate({ opacity: 0 }, 1000, function(){
				underlay.css({ 
					backgroundImage: 'url(' + img.src + ')', 
					width: img.width, 
					left: -(img.width / 2)
				})
				.animate({ opacity: hash && hash.length > 1 ? 0 : 0.9 }, 1000);
			});
		};
		
		img.src = 'images/backgrounds/' + index + '.jpg';
	};
		
	//setInterval(rotate, 15000);

	if(hash && hash.length > 1){
		hash = hash.substring(1).toLowerCase();
		$('footer a[data-section=' + hash + ']').click(); 
	}

	rotate(0);
	
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