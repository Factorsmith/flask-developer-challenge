//
// Requires:  jquery-2.1.4.min.js
// html ids: 'author', 'repo0', 'errorMsg', 'processingImg', 'totalCount', 'row0'   
//
var letters = /^[A-Za-z]+$/;
var numbersAndLetters = /^[a-z0-9]+$/i;
var rowCount = 0;
var currentPattern = 0;

function checkAuthor( author) {
	var authorVal = "";
	if( !!author) {
		authorVal = author.trim();
	}
	if( !authorVal.length) {
		$("#errorMsg").html("Please enter an Author Name to Search for.");
		return false;		
	}
		
	if( authorVal.match( letters)) {
		$("#author").html( authorVal);
		return true; //OK
	}
	
	$("#errorMsg").html("Invalid Author:  must contain all alphabetical letters.");
	return false;
}

function checkPattern( pattern) {
	var patternVal = "";
	if( !!pattern) {
		patternVal = pattern.trim();
	}
	$("#pattern").html( patternVal);
	currentPattern = patternVal;
	
	if( !patternVal.length) {
		currentPattern = 0;
		return true; //OK	
	}
		
	if( patternVal.match( numbersAndLetters)) {
		return true; //OK
	}
	
	$("#errorMsg").html("Invalid Search Pattern:  must contain all numbers and letters.");
	return false;
}

function onSuccess( response) {
	var jsObj = null;  
	var errorMsg = "Error: no response received";
    $("#processingImg").hide();
    rowCount = 0;
    
	if( !!response) {
		try {  
			rowCount = response.total_count;
			jsObj = response.items;
		}
		catch( e) {   
			jsObj = null;
			errorMsg = "Response Error: " + e.message;			
		}
	}   
	if( jsObj == null ) {
		$("#errorMsg").html( errorMsg);
		return;
	}

	$("#totalCount").html( "Total Count: " + rowCount);
	if( !rowCount) {
		$("#repo0").html( "-empty-");
		return;
	}
	
	// ==== OK ====
		
	var formattedResult = "";	
	var lastRowId = "";	

	for(var i=0; i < rowCount; i++){
		formattedResult = '[ID] '      	+ jsObj[i]['id']; 
		formattedResult += '   [NAME] ' 	+ jsObj[i]['name']; 
		formattedResult += '   [FULL-NAME] ' + jsObj[i]['full_name'] 	+ "\r\n"; 			
		formattedResult += '[DESCRIPTION] '  + jsObj[i]['description'] 	+ "\r\n"; 
		formattedResult += '[LAST-UPDATE] '	+ jsObj[i]['updated_at']	+ "\r\n"; 
		formattedResult += '[URL] ' 		+ jsObj[i]['url'] 		+ "\r\n"; 
		formattedResult += '[LANGUAGE] ' 	+ jsObj[i]['language']; 		
		formattedResult += '   [SIZE] ' 	+ jsObj[i]['size']; 
		formattedResult += '   [WATCHERS] ' 	+ jsObj[i]['watchers']; 		
		formattedResult += '   [HAS-WIKI] ' 	+ jsObj[i]['has_wiki'] 		+ "\r\n\r\n"; 
		
		if( i > 0) {
			$('<div id="row'+i+'"><textarea id="repo'+i+'" rows="6" cols="700" disabled tabindex=-1 ></textarea>').insertAfter("#"+lastRowId);
		}
		$("#repo"+i).html( formattedResult);
		if( currentPattern) { 
			$("#repo"+i).highlightTextarea({
				words: [ currentPattern ],
				caseSensitive: false
			});
		}
		lastRowId = "row"+i;
	}		
}	

function onError( jqxhr) {
    $("#processingImg").hide();
    var responseErr = jqxhr.status;
    
    switch( jqxhr.status) {
    	case 401:
    		responseErr = "unauthorized access to private repository"; 
    		break;
    	case 404:
    		responseErr = "The listed users and repositories cannot be searched either because the resources do not exist or you do not have permission to view them.";	
    		break;
    	case 422:
    		$("#repo0").html( "-empty-");	    		
    	default:
    		responseErr = "Status: " + jqxhr.status;
    } 
    
    $("#errorMsg").html( responseErr);	
}

function callGitSearch() {
	var formerPattern = currentPattern;
	$("#errorMsg").html("");
	if( !checkAuthor( $("#author").val())) { return;}
	if( !checkPattern( $("#pattern").val())) { return;}
	
	// Remove Prior Results
	$("#repo0").html("");
	for(var i=1; i < rowCount; i++){
		$("#row"+i).html("");
		$("#row"+i).remove();
	}
	rowCount = 0;
	// Un-Highlight first row, or colorization will be Sticky
	if( formerPattern) {
		$('.highlightTextarea-container').remove();
		$('.highlightTextarea').remove();		
		$('#row0').html('<textarea id="repo0" rows="6" cols="700" disabled tabindex=-1 ></textarea>');
	}
	
	$("#processingImg").show();			

	var postData;
	if( currentPattern) {
		postData = { user: $("#author").val(), pattern: currentPattern};
	}
	else {
		postData = { user: $("#author").val()};		
	}
    $.ajax({
        type: "POST",
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        url: "http://flask.factorsmith.com/searchAuthor",
        data: JSON.stringify( postData),
		success: onSuccess,
		error: onError
    });	

}
