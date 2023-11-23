//
// JavaScript helper functions
//

// the api at present is always 1
let api_version = '1';
// store a session_id locally if we can - see if we have one
// careful - this session_id could expire if you use this sample code for a long time
// in which case you'll have to manually remove it from your browser - or uncomment the next line:
// set_local_storage("session_id", null);
let session_id = get_local_storage("session_id");

// pagination - always page 0 for now, and 10 per page
let page = 0;
let page_size = 10;

// variables for result data after search
let semantic_search_results = [];
let num_results = 0;
let num_pages = 0;

// sharding - handled by SimSage - just pass through and store - initially empty-list
let shard_size_list = [];

// a few constants - just leave them as they are
let fragment_count = 1;
let max_word_distance = 40;
let use_spelling_suggest = false;

///////////////////////////////////////////////

/**
 * sign-into SimSage - most instances don't allow anonymous querying
 * you'll need to use the admin UX of your instance to create a user
 * and a password
 *
 * @param text          what to search for (e.g. "test")
 * @param data          a data-block with SimSage details, like organisation, knowledge-base, and user information
 * @param callback      where to callback to when the search has completed successfully
 */
function sign_in_and_search_for(text, data, callback) {
    // if we don't have a session - we need to get one - sign-in!
    if (!session_id) {
        const sign_in_data = {
            "email": data.email,
            "password": data.password
        };
        // sign in
        post_message(data.api_base, '/auth/sign-in',
            sign_in_data,
            function (data) {
                // got it?  set the session_id
                if (data && data.session && data.session.id) {
                    // store the session locally
                    session_id = data.session.id;
                    set_local_storage("session_id", session_id);
                    // and perform a search now that we have a session
                    do_search(text, data, callback);

                } else {
                    alert("sign-in return data not right?");
                }
            }
        );
    } else {
        // we have a session already, perform a search
        do_search(text, data, callback);
    }
}

///////////////////////////////////////////////

// test if the browser supports local storage
function has_local_storage() {
    try {
        let test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

// retrieve an item from browser local storage
function get_local_storage(name) {
    let hasLs = has_local_storage();
    if (hasLs) {
        return localStorage.getItem(name);
    }
    return "";
}

// set/or remove an item from browser local storage
function set_local_storage(name, value) {
    let hasLs = has_local_storage();
    if (hasLs) {
        if (value)
            localStorage.setItem(name, value);
        else
            localStorage.removeItem(name);
    }
}

// helper - post a message to SimSage using jQuery
function post_message(api_base, endPoint, data, callback) {
    let url = api_base + endPoint;
    // these are our standard headers
    let headers = {
        'Content-Type': 'application/json',
        'API-Version': api_version,
    };
    // add our session_id to our header if we have one
    if (session_id && session_id.length > 0) {
        headers["session-id"] = session_id;
    }
    // and POST the search data into SimSage
    jQuery.ajax({
        headers: headers,
        'data': JSON.stringify(data),
        'type': 'POST',
        'url': url,
        'dataType': 'json',
        'success': function (data) {
            // callback on success
            if (callback) {
                callback(data);
            }
        }
    }).fail(function (err) {
        console.error(JSON.stringify(err));
    });
}

// Search result callback handler
function receive_search_results(data, callback) {
    if (data.messageType === 'message') {
        semantic_search_results = [];

        // did we get semantic search results?
        if (data.resultList) {
            shard_size_list = data.shardSizeList; // copy for next call for multi-sharded SimSage

            data.resultList.map(function (sr) {
                if (!sr.botResult) {
                    // enhance search result for display
                    if (sr.textIndex >= 0 && sr.textIndex < sr.textList.length) {
                        sr['index'] = sr.textIndex;  // inner offset index
                    } else {
                        sr['index'] = 0;  // inner offset index
                    }
                    sr['num_results'] = sr.textList.length;
                    semantic_search_results.push(sr);  // add item
                }
            });
            // work out the exact number of pages
            num_results = data.totalDocumentCount;
            let divided = data.totalDocumentCount / page_size;
            num_pages = parseInt("" + divided);
            if (parseInt("" + divided) < divided) {
                num_pages += 1;
            }
        } else {
            // cleanup, no results
            num_results = 0;
            num_pages = 0;
            shard_size_list = [];
        }

        // output the results to the browser's console too
        console.log('the search results');
        console.log(JSON.stringify(semantic_search_results));
        console.log('page:' + page);
        console.log('page-size:' + page_size);
        console.log('number of results total:' + num_results);
        console.log('number of page total (given page-size):' + num_pages);

        // and call back to the interested parties with the data
        if (callback) {
            callback(semantic_search_results);
        }

    } // if message-type is right
}


// perform the search
function do_search(text, data, callback) {
    // search in data-structure
    let clientQuery = {
        'organisationId': data.organisation_id,
        'kbList': [data.kb_id],
        'clientId': session_id,
        'semanticSearch': true,
        'query': text,
        'page': page,
        'pageSize': page_size,
        'shardSizeList': shard_size_list,
        'fragmentCount': fragment_count,
        'maxWordDistance': max_word_distance,
        'spellingSuggest': use_spelling_suggest,
    };

    // do the search
    post_message(data.api_base, '/semantic/query', clientQuery, function(data) {
        receive_search_results(data, callback);
    });
}
