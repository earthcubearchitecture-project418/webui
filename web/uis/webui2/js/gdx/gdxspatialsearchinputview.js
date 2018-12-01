function initializeSpatialSearchInputView(){
	
	indexesParentElement = "spatialSearchInputPanel3";
	
	document.getElementById("spatialSearchResultsView").style.display = "none";
	
	//Set initial location to Boulder, CO.
	currentLocation = [40.0150, -105.2705]
	
    //Create Leaflet Map
    inputMap = L.map('spatialSearchInputMap').setView(currentLocation, 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWxpbmdlcmYiLCJhIjoiY2pjamhlZTl1NGRxazJxbzU0OHE5d3ZxNyJ9.n7A_BBoZxnpA2izU3McwSQ', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiZWxpbmdlcmYiLCJhIjoiY2pjamhlZTl1NGRxazJxbzU0OHE5d3ZxNyJ9.n7A_BBoZxnpA2izU3McwSQ'
    }).addTo(inputMap);
    
    //Create an initial marker and set color to green for current location
    greenIcon = new L.Icon({
	    	iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	    	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	    	iconSize: [25, 41],
	    	iconAnchor: [12, 41],
	    	popupAnchor: [1, -34],
	    	shadowSize: [41, 41]
    });

    //Create fields for location entry
   	$("#spatialSearchInputLatField").jqxInput({height: componentHeight, width: '100%', theme: "darkblue"});
    $("#spatialSearchInputLonField").jqxInput({height: componentHeight, width: '100%', theme: "darkblue"});
    
    //Initialize field values 
    $("#spatialSearchInputLatField").jqxInput('val', currentLocation[0].toFixed(precision));
    $("#spatialSearchInputLonField").jqxInput('val', currentLocation[1].toFixed(precision));
    
    //Create buttons
    $("#spatialSearchInputUpdateButton").jqxButton({ width: '100%', height: componentHeight, theme: "darkblue" });
	$("#spatialSearchInputAddButton").jqxButton({ width: '100%', height: componentHeight, theme: "darkblue" });
    $("#spatialSearchInputRemoveButton").jqxButton({ width: '100%', height: componentHeight, theme: "darkblue" });
    $("#spatialSearchInputSubmitButton").jqxButton({ width: '333px', height: componentHeight, theme: "darkblue" });
   
    //Add event listeners to buttons
    $("#spatialSearchInputUpdateButton").on('click', spatialSearchInputUpdateButtonClicked);
	$("#spatialSearchInputAddButton").on("click", spatialSearchInputAddButtonClicked);
	$("#spatialSearchInputRemoveButton").on("click", spatialSearchInputRemoveButtonClicked);
	$("#spatialSearchInputSubmitButton").on("click", spatialSearchInputSubmitButtonClicked);
	
	//Create list for holding locations
    $("#spatialSearchInputListBox").jqxListBox({height: '100%', width: '100%', theme: "darkblue"});
    
	//Create error window 
    $('#gdxErrorWindow').jqxWindow({  
    		title: 'Attention!',
    		width: 400,
        height: 140, 
        resizable: true,
        autoOpen: false,
        isModal: true,
        theme: "darkblue"
    });
    $("#gdxErrorWindowOKButton").jqxButton({ width: 75, height: 30, theme: "darkblue" });
    $("#gdxErrorWindowOKButton").on("click", gdxErrorWindowOKButtonClicked);
    
    //Create wait window 
    $('#gdxWaitWindow').jqxWindow({  
    		title: 'Please Wait...',
    		width: 400,
        height: 140, 
        resizable: true,
        autoOpen: false,
        isModal: true,
        theme: "darkblue"
    });
    
    redrawInputMap();
    
}

function badLocation(){
	var lat = $("#spatialSearchInputLatField").jqxInput('val');
	var lon = $("#spatialSearchInputLonField").jqxInput('val');
	return isNaN(lat) || isNaN(lon);
}

function locationExists(){
	var lat = parseFloat($("#spatialSearchInputLatField").jqxInput('val'));
	var lon = parseFloat($("#spatialSearchInputLonField").jqxInput('val'));
	var locations = $("#spatialSearchInputListBox").jqxListBox('getItems');
 	if(locations){
    		for(var i = 0; i<locations.length; i++){
			var location = locations[i];
			var locationLabel = location.label;
			var locationLabelArray = locationLabel.split(",");
			var latTemp = parseFloat(locationLabelArray[0]);
			var lonTemp = parseFloat(locationLabelArray[1]);
			if(latTemp==lat && lonTemp==lon){
				return true;
			}
    		}
 	}
 	return false;
}

function gdxErrorWindowOKButtonClicked(){
	$('#gdxErrorWindow').jqxWindow('close');
}

function spatialSearchInputUpdateButtonClicked(){
		
	//Update the location of the current marker
	var lat = $("#spatialSearchInputLatField").jqxInput('val');
	var lon = $("#spatialSearchInputLonField").jqxInput('val');

	if(!badLocation()){
		$("#spatialSearchInputLatField").jqxInput('val', parseFloat(lat).toFixed(precision));
    		$("#spatialSearchInputLonField").jqxInput('val', parseFloat(lon).toFixed(precision));
		redrawInputMap();
	}else{
		document.getElementById("gdxErrorWindowMessage").innerHTML = "Please enter numeric values for Latitude and Longitude.";
		$('#gdxErrorWindow').jqxWindow('open');
	}
}

function spatialSearchInputAddButtonClicked(){
	//Add the current location
	var lat = $("#spatialSearchInputLatField").jqxInput('val');
	var lon = $("#spatialSearchInputLonField").jqxInput('val');
	if(!badLocation()){
		if(!locationExists()){
			$("#spatialSearchInputListBox").jqxListBox('addItem', parseFloat(lat).toFixed(precision) + ", " + parseFloat(lon).toFixed(precision));
			redrawInputMap();
		}
	}else{
		document.getElementById("gdxErrorWindowMessage").innerHTML = "Please enter numeric values for Latitude and Longitude.";
		$('#gdxErrorWindow').jqxWindow('open');
	}
}

function spatialSearchInputRemoveButtonClicked(){
	//Remove the selected location
	var item = $("#spatialSearchInputListBox").jqxListBox('getSelectedItem'); 
	$("#spatialSearchInputListBox").jqxListBox('removeItem', item);
	redrawInputMap();
}

function spatialSearchInputSubmitButtonClicked(){
	document.getElementById("gdxWaitWindowMessage").innerHTML = "Please wait while data is loaded from Geodex.org.";
	$('#gdxWaitWindow').jqxWindow('open');
	var keyArray = ["geowithin"];
    	var valueArray = [getGeoJSONString()];
	performWebServiceCall(WebServiceActions.SPATIAL_SEARCH_OBJECT, keyArray, valueArray, updateAfterSpatialSearchObject);
}

function getGeoJSONString(){
	var locations = $("#spatialSearchInputListBox").jqxListBox('getItems');
 	var data = [];
    if(locations){
	    for(var i = 0; i<locations.length; i++){
			var location = locations[i];
			var locationLabel = location.label;
			var locationLabelArray = locationLabel.split(",");
			var lat = parseFloat(locationLabelArray[0]);
			var lon = parseFloat(locationLabelArray[1]);
			data.push({"lat": lat, "lon": lon});
	    }
    }
    var geojson = GeoJSON.parse(data, {Point: ['lat', 'lon']});
    return JSON.stringify(geojson);
}

function gotoSpatialSearchResultsView(){
	document.getElementById("spatialSearchInputView").style.display = "none";
	document.getElementById("spatialSearchResultsView").style.display = "grid";
	initializeSpatialSearchResultsView();
}

function updateAfterSpatialSearchObject(data){
	$('#gdxWaitWindow').jqxWindow('close');
	mainData.populateSpatialResults(data);
	gotoSpatialSearchResultsView();
}

function redrawInputMap(){
	
	var lat = parseFloat($("#spatialSearchInputLatField").jqxInput('val'));
	var lon = parseFloat($("#spatialSearchInputLonField").jqxInput('val'));
	
	//Create an initial marker and set color to green for current location
    var greenIcon = new L.Icon({
	    	iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
	    	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
	    	iconSize: [25, 41],
	    	iconAnchor: [12, 41],
	    	popupAnchor: [1, -34],
	    	shadowSize: [41, 41]
    });
    
	//Remove all current markers
	for(var i = 0; i<oldMarkers.length; i++){
		inputMap.removeLayer(oldMarkers[i]);
	}
	
	//Remove all current lines
	for(var i = 0; i<oldLines.length; i++){
		inputMap.removeLayer(oldLines[i]);
	}
	
	//Add marker to map
    marker = L.marker([lat, lon], {icon: greenIcon}).addTo(inputMap);
	oldMarkers.push(marker);
	
	//Create new markers for each location
	var locations = $("#spatialSearchInputListBox").jqxListBox('getItems');
	
	if(locations){
	
		for(var i = 0; i<locations.length; i++){
			
			var location = locations[i];
			var locationLabel = location.label;
			var locationLabelArray = locationLabel.split(",");
			var lat = locationLabelArray[0];
			var lon = locationLabelArray[1];
	
			var marker = L.marker([lat, lon]).addTo(inputMap);
			oldMarkers.push(marker);
			
		}
		
		//Draw lines and polygons
		if(locations.length>1){
			
			var latlngs = [];
			var points = [];
			
			for(var i = 0; i<locations.length; i++){
				
				var location = locations[i];
				var locationLabel = location.label;
				var locationLabelArray = locationLabel.split(",");
				var lat = parseFloat(locationLabelArray[0]);
				var lon = parseFloat(locationLabelArray[1]);
		
				points.push(new Point(lat, lon));
				
			}
			
			upper = upperLeft(points);
			points.sort(pointSort);
			
			for(var i = 0; i<points.length; i++){
				var latlng = L.latLng(parseFloat(points[i].lat), parseFloat(points[i].lon));
				latlngs.push(latlng);
			}
			latlng = L.latLng(parseFloat(points[0].lat), parseFloat(points[0].lon));
			latlngs.push(latlng);
			
			var polyline = L.polyline(latlngs).addTo(inputMap);
			oldLines.push(polyline);
			
		}
	
	}
	
	setFitBoundsForInputMap();
	
}

function setFitBoundsForInputMap(){
	
	//Calculate a bounding box that will include all markers
	var lat = $("#spatialSearchInputLatField").jqxInput('val');
	var lon = $("#spatialSearchInputLonField").jqxInput('val');
	
	neLocationLat = parseFloat(lat);
    neLocationLon = parseFloat(lon);
    swLocationLat = parseFloat(lat);
    swLocationLon = parseFloat(lon);
    
    var locations = $("#spatialSearchInputListBox").jqxListBox('getItems');
    
    if(locations){
    
	    for(var i = 0; i<locations.length; i++){
			
			var location = locations[i];
			var locationLabel = location.label;
			var locationLabelArray = locationLabel.split(",");
			var lat = parseFloat(locationLabelArray[0]);
			var lon = parseFloat(locationLabelArray[1]);
			
			if (lat < swLocationLat){
				swLocationLat = parseFloat(lat);
			}
			if (lon < swLocationLon){
				swLocationLon = parseFloat(lon);
			}
	
			if (lat > neLocationLat){
				neLocationLat = parseFloat(lat);
			}
			if (lon > neLocationLon){
				neLocationLon = parseFloat(lon);
			}
			
	    }
    
    }
    
    swLocation = [swLocationLat, swLocationLon]
    neLocation = [neLocationLat, neLocationLon]

    inputMap.fitBounds([swLocation, neLocation]);
    
}