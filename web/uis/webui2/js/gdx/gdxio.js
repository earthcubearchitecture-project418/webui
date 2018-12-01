//Create an enum with properties for each web service call
var WebServiceActions = {
		
	TEXTINDEX_SEARCH: 			0,
	TEXTINDEX_SEARCHSET: 		1,
	SPATIAL_SEARCH_OBJECT: 		2, 
	SPATIAL_SEARCH_RESOURCE: 	3,
	SPATIAL_SEARCH_RESOURCESET: 	4, 
	TYPEAHEAD_PROVIDERS: 		5,
	GRAPH_RESDETAILS: 			6,
	GRAPH_RESSETDETAILS: 		7, 
	GRAPH_RESSETPEOPLE: 			8, 
	
	properties:{
		0: {webServiceType: "GET",  urlSuffix: "textindex/search"},
		1: {webServiceType: "GET",  urlSuffix: "textindex/searchset"},
		2: {webServiceType: "GET",  urlSuffix: "spatial/search/object"},
		3: {webServiceType: "GET",  urlSuffix: "spatial/search/resource"},
		4: {webServiceType: "POST", urlSuffix: "spatial/search/resourceset"},
		5: {webServiceType: "GET",  urlSuffix: "typeahead/providers"},
		6: {webServiceType: "GET",  urlSuffix: "graph/resdetails"},
		7: {webServiceType: "POST", urlSuffix: "graph/ressetdetails"},
		8: {webServiceType: "POST", urlSuffix: "graph/ressetpeople"}
	}
}

//Perform call to geodex web service
function performWebServiceCall(webServiceAction, keyArray, valueArray, updateFunction){
	
	//Add for IE calls
	if(window.XMLHttpRequest){
        xmlhttp = new XMLHttpRequest();
    }else{
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
	
	//Set listener for call completion
    xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			//alert(xmlhttp.responseText);
			var data = JSON.parse(xmlhttp.responseText);
			//document.getElementById("output").innerHTML = JSON.stringify(data);
			updateFunction(data);
		}
	};
	
	//Create args to web service
	var args = "";
	for(var i=0; i<keyArray.length; i++){
		if(i==(keyArray.length-1)){
			args += keyArray[i] + "=" + valueArray[i];
		}else{
			args += keyArray[i] + "=" + valueArray[i] + "&";
		}
	}

	//Set core domain name for request URL
	var domainURL = "http://geodex.org/api/v1/";
	
	//Create request URL
	var requestURL = domainURL;
	
	//Add the suffix for the call
	requestURL += WebServiceActions.properties[webServiceAction].urlSuffix;

	//Get the type of request URL: GET or POST 
	var webServiceType = WebServiceActions.properties[webServiceAction].webServiceType;

	//Send to web service if POST
	if(webServiceType=="POST"){
		xmlhttp.open(webServiceType, requestURL, true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(args);
		
	//Else send for GET
	}else if(webServiceType=="GET"){
		if(args!=""){
			requestURL += "?" + args;
		}
		//document.getElementById("output").innerHTML = requestURL;
		//alert(requestURL);
		xmlhttp.open(webServiceType, requestURL, true);
		xmlhttp.send(null);
	}

}