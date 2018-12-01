function initializeTextSearchInputView(){

	indexesParentElement = "textSearchInputPanel2";
	
	document.getElementById("textSearchResultsView").style.display = "none";
	
	//Create text fields
    $("#textSearchInputValueField").jqxInput({ width: '100%', height: componentHeight, theme: "darkblue"});
    $("#textSearchInputValueField").jqxInput("val", "carbon");
    
    //Create radio buttons
    $("#textSearchInputSetButton").jqxRadioButton({ width: 250, height: 25, checked: true, theme: "darkblue"});
    $("#textSearchInputIndexButton").jqxRadioButton({ width: 250, height: 25, theme: "darkblue"});
    
    //Create number inputs
    $("#textSearchInputNumberInput").jqxNumberInput({ width: '100%', height: componentHeight, spinButtons: true, 
    														inputMode: 'simple', decimalDigits: 0, spinButtonsStep: 10, readOnly: true, theme: "darkblue"});
    
    //Create buttons
    $("#textSearchInputSubmitButton").jqxButton({ width: "333px", height: componentHeight, theme: "darkblue" });
    
    //Add event listeners
    $('#textSearchInputSubmitButton').on('click', function (event) {
    	
    		document.getElementById("gdxWaitWindowMessage").innerHTML = "Please wait while data is loaded from Geodex.org.";
		$('#gdxWaitWindow').jqxWindow('open');
    	
		mainData.clearSelectedProviders();
		for(var i=0; i<mainData.getProviders().length; i++){
			var provider = mainData.getProviders()[i];
			var index = provider.getIndex();
			var checked = $("#" + index.toString()).jqxCheckBox('checked');
			if(checked){
				mainData.addSelectedProvider(provider);
			}
		}
		
		if($("#textSearchInputSetButton").jqxRadioButton('val')){
			
			var keyArray = ["q", "s", "n"];
    			var valueArray = [$("#textSearchInputValueField").jqxInput("val"), "0", $("#textSearchInputNumberInput").jqxNumberInput("val").toString()];
			performWebServiceCall(WebServiceActions.TEXTINDEX_SEARCHSET, keyArray, valueArray, updateAfterTextindexSearchset);
			
		}else if($("#textSearchInputIndexButton").jqxRadioButton('val')){
			
			var indexes = "";
			for(var i=0; i<mainData.getSelectedProviders().length; i++){
				var provider = mainData.getSelectedProviders()[i];
				indexes += provider.getIndex();
				if(i<(mainData.getSelectedProviders().length-1)){
					indexes += ",";
				}
			}
			var keyArray = ["q", "s", "n", "i"];
    			var valueArray = [$("#textSearchInputValueField").jqxInput("val"), "0", $("#textSearchInputNumberInput").jqxNumberInput("val").toString(), indexes];
			performWebServiceCall(WebServiceActions.TEXTINDEX_SEARCH, keyArray, valueArray, updateAfterTextindexSearch);
			
		}
		
	});
   
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
    
    //Call and get current providers list
    var keyArray = [];
   	var valueArray = [];
    performWebServiceCall(WebServiceActions.TYPEAHEAD_PROVIDERS, keyArray, valueArray, updateAfterTypeaheadProviders);
    
}

function updateAfterTypeaheadProviders(data){
	mainData.processProviders(data);
	initializeIndexCheckBoxes();
}

function gotoTextSearchResultsView(){
	document.getElementById("textSearchInputView").style.display = "none";
	document.getElementById("textSearchResultsView").style.display = "grid";
	initializeTextSearchResultsView();
}

function updateAfterTextindexSearchset(data){
	$('#gdxWaitWindow').jqxWindow('close');
	mainData.populateSelectedProviderTextResults(data);
	gotoTextSearchResultsView();
}

function updateAfterTextindexSearch(data){
	$('#gdxWaitWindow').jqxWindow('close');
	mainData.populateTextResults(data);
	gotoTextSearchResultsView();
}