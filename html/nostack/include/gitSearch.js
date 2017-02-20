//
// Requires:  jquery-2.1.4.min.js
// html ids: 'author', 'repo0', 'errorMsg', 'processingImg', 'totalCount', 'row0'   
//
var url = "https://api.github.com/search/repositories?sort=updated&order=asc&q=pushed:>=2012-01-01+user:";
var letters = /^[A-Za-z]+$/;
var rowCount = 0;

function checkArgs( author) {
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
	$("#errorMsg").html("");
	if( !checkArgs( $("#author").val())) { return;}

	// Remove Prior Results
	$("#repo0").html("");
	for(var i=1; i < rowCount; i++){
		$("#repo"+i).remove();
	}
	rowCount = 0;
	
	$("#processingImg").show();			
	var jqxhr = $.ajax({
						headers: {Accept: "application/vnd.github.v3+json"},
						type: "GET",
						url: url+$("#author").val(),
						success: onSuccess,
						error: onError
					});

}