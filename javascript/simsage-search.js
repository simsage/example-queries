
let api_version = '1';
let session_id = get_local_storage("session_id");

// pagination
let page = 0;
let page_size = 10;

// result data after search
let semantic_search_results = [];
let num_results = 0;
let num_pages = 0;

// sharding - handled by SimSage - just pass through and store - initially empty-list
let shard_size_list = [];

// a few constants - just leave them as they are
let fragment_count = 1;
let max_word_distance = 20;
let use_spelling_suggest = false;


///////////////////////////////////////////////

function sign_in_and_search_for(text, data, callback) {
    // if we don't have a session - we need to get one - sign-in!
    if (!session_id) {
        const sign_in_data = {
            "email": data.email,
            "password": data.password
        };
        post_message(data.base_url, '/api/auth/sign-in',
            sign_in_data,
            function (data) {
                // got it?  set the session_id
                if (data && data.session && data.session.id) {
                    session_id = data.session.id;
                    set_local_storage("session_id", session_id);
                    // and perform a search
                    do_search(text, data, callback);
                }
            }
        );
    } else {
        // we have a session, perform a search
        do_search(text, data, callback);
    }
}

///////////////////////////////////////////////


// get a random number as a 4 digit hex-string
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

// combine a series of random four digits to create a guid
function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


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


function get_local_storage(name) {
    let hasLs = has_local_storage();
    if (hasLs) {
        return localStorage.getItem(name);
    }
    return "";
}


function set_local_storage(name, value) {
    let hasLs = has_local_storage();
    if (hasLs) {
        localStorage.setItem(name, value);
    }
}


// fixed client-id to keep track (anonymously) of clients
// this aggregates number of searches per day per unique user
// what users search for etc.
function get_client_id() {
    let key = 'simsearch_client_id';
    let clientId = get_local_storage(key);
    if (!clientId) {
        clientId = guid();
        set_local_storage(key, clientId);
    }
    return clientId;
}


// helper - post a message using jQuery
function post_message(base_url, endPoint, data, callback) {
    let url = base_url + endPoint;
    let headers = {
        'Content-Type': 'application/json',
        'API-Version': api_version,
    };
    if (session_id && session_id.length > 0) {
        headers["session-id"] = session_id;
    }
    jQuery.ajax({
        headers: headers,
        'data': JSON.stringify(data),
        'type': 'POST',
        'url': url,
        'dataType': 'json',
        'success': function (data) {
            if (callback) {
                callback(data);
            }
        }
    }).fail(function (err) {
        console.error(JSON.stringify(err));
    });
}



// perform the search
function do_search(text, data, callback) {
    // search in data-structure
    let clientQuery = {
        'organisationId': data.organisation_id,
        'kbList': [data.kb_id],
        'clientId': session_id ? session_id : get_client_id(),
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
    post_message(data.base_url, '/api/semantic/query', clientQuery, function(data) {
        receive_search_results(data, callback);
    });
}


// callback on-result
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

        // output the results
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

