
// Set your ids and constants for SimSage (must come from SimSage)
let organisation_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
let kb_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
let source_id = '1';
// the UK production server at present  (see https://cloud.simsage.ai/documentation/swagger-ui.html)
let base_url = 'https://cloud.simsage.ai';
let api_version = '1';

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
let bot_threshold = 0.8125;
let fragment_count = 1;
let max_word_distance = 20;
let use_spelling_suggest = false;


///////////////////////////////////////////////
// do a search example
do_search('some keywords');

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


// fixed client-id to keep track (anonymously) of clients
// this aggregates number of searches per day per unique user
// what users search for etc.
function get_client_id() {
    let clientId = "";
    let key = 'simsearch_client_id';
    let hasLs = has_local_storage();
    if (hasLs) {
        clientId = localStorage.getItem(key);
    }
    if (!clientId || clientId.length === 0) {
        clientId = guid(); // create a new client id
        if (hasLs) {
            localStorage.setItem(key, clientId);
        }
    }
    return clientId;
}

// helper - post a message using jQuery
function post_message(endPoint, data, callback) {
    let url = base_url + endPoint;
    jQuery.ajax({
        headers: {
            'Content-Type': 'application/json',
            'API-Version': api_version,
        },
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
function do_search(text) {
    // this string is the advanced query-string and is based on the search-text
    // this is used for complex boolean queries and metadata searching - just leave it as this for now
    let search_query_str = '(' + text + ')';

    // search in data-structure
    let clientQuery = {
        'organisationId': organisation_id,
        'kbList': [kb_id],
        'clientId': get_client_id(),
        'semanticSearch': true,
        'query': search_query_str,
        'queryText': text,
        'numResults': 1, // number of bot results to return, set to 1
        'scoreThreshold': bot_threshold,
        'page': page,
        'pageSize': page_size,
        'shardSizeList': shard_size_list,
        'fragmentCount': fragment_count,
        'maxWordDistance': max_word_distance,
        'spellingSuggest': use_spelling_suggest,
        'contextLabel': '',
        'contextMatchBoost': 0.01,
        'sourceId': source_id,
    };

    // do the search
    post_message('/api/ops/query', clientQuery, function(data) {
        receive_search_results(data);
    });
}


// callback on-result
function receive_search_results(data) {
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

    } // if message-type is right
}

