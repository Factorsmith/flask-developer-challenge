# coding=utf-8
"""
Exposes a simple HTTP API to search a users Gists via a regular expression.

Github provides the Gist service as a pastebin analog for sharing code and
other develpment artifacts.  See http://gist.github.com for details.  This
module implements a Flask server exposing two endpoints: a simple ping
endpoint to verify the server is up and responding and a search endpoint
providing a search across all public Gists for a given Github account.
"""

import requests, logging
from flask import Flask, abort, jsonify, request
from flask_cors import CORS

# *The* app object
app = Flask(__name__)
CORS(app)

LOG_FILENAME = '/var/www/html/fdc/error-fdc.log'
logging.basicConfig(filename=LOG_FILENAME, level=logging.ERROR)

gitApiUrl = 'https://api.github.com/search/repositories?sort=updated&order=asc&q='
# LAS: Limit the result set by default with the Last Push Date in 2012 or Later
dateQuery ='pushed:>=2012-01-01'

patternHeaders = {'content-type': 'application/json', "Accept": "application/vnd.github.v3.text-match+json"}
noPatternHeaders = {'content-type': 'application/json', "Accept": "json"}

@app.route("/ping")
def ping():
    """Provide a static response to a simple GET request."""
    return "pong"

"""
    Returns one page of results, GIT API default max page size: 30
"""
def search( url, headers):
    
    response = requests.get( url, headers=headers)

    # BONUS: What failures could happen?    
    # LAS: Invalid Permissions:  codes 422, etc are checked for on the client side    
    if response.status_code > 200:
        abort( response.status_code)
    
    repos = response.json()    
    row_count = repos.get('total_count')
    #print "%s%s%s%s" % ("Total Count: ", row_count, ", Status: ", response.status_code)

    # BONUS: Paging? How does this work for users with tons of gists?
    # LAS:  the default page size is 30, so there may be more calls to make
#    if row_count > 30:

    """ LAS: Return a subset of the repository attributes """
    items = repos.get('items');
    retItems = []
    for repo in items:
        retItems.append({
		'id':repo['id'],
		'name':repo['name'],
		'full_name': repo['full_name'],
        'description': repo['description'],
        'updated_at': repo['updated_at'],
	    'url': repo['url'],
        'language': repo['language'],
	    'size': repo['size'],
        'watchers': repo['watchers'],
	    'has_wiki': repo['has_wiki']})

    result = {'total_count' : row_count, 'items' : retItems}
    return result


@app.route("/searchAuthor", methods=['POST'])
def searchAuthor():

    """Provides matches for a single pattern across a single users gists.

    Pulls down a list of all gists for a given user and then searches
    each gist for a given regular expression.

    Returns:
        A Flask Response object of type application/json.  The result
        object contains the list of matches along with a 'status' key
        indicating any failure conditions.
    """
    # BONUS: Validate the arguments?
        
    if request.method == 'POST':
        if not request.get_json():
            print "gistapi.searchAuthor, ERROR: missing POST json data"
            logging.error('gistapi.searchAuthor, ERROR: missing POST json data')
            abort(400)
        else:
            post_data = request.get_json()
    else:    
        print "gistapi.searchAuthor, ERROR: missing POST"
        logging.error('gistapi.searchAuthor, ERROR: missing POST')
        abort(400)

    # BONUS: Handle invalid users?
    # LAS:  Verified not empty and all alpha characters on the client side
    if not post_data.get('user'):
        print "gistapi.searchAuthor, ERROR: missing USER"
        logging.error('gistapi.searchAuthor, ERROR: missing USER')
        abort(400)
    
    """  OK  """
                
    username = post_data.get('user')        

    """ OK if no pattern, just return all user repositories """
    
    if post_data.get('pattern'):
        pattern = post_data['pattern']
        request_url = "%s%s%s%s%s%s" % (gitApiUrl, pattern, "+", dateQuery, "+user:", username)
        headers = patternHeaders    
    else:   
        headers = noPatternHeaders
        request_url = "%s%s%s%s" % (gitApiUrl, dateQuery, "+user:", username)

    gists = search( request_url, headers)
  
    return jsonify(gists)

"""
     LAS:  used the GIT API to find the pattern
     https://developer.github.com/v3/search/#text-match-metadata
     
     Since jQuery can highlight on the client, no need to pass text_matches arrays
     ie:  text_matches[0]["property"]  == "description"
    ====================================================================
    
    result = {}
    for gist in gists:
        # REQUIRED: Fetch each gist and check for the pattern
        # BONUS: What about huge gists?
        # BONUS: Can we cache results in a datastore/db?
        pass

    result['status'] = 'success'
    result['username'] = username
    result['pattern'] = pattern
    result['matches'] = []
"""

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
