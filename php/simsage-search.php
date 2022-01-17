<?php

// a result holder for a SimSage search result
class SimSageResult
{
    public $search_text = "";                   // what you originally searched for
    public $semantic_search_results = [];       // a list of results (size of page_size below)
    public $num_results = 0;                    // the total number of results (all results count)
    public $num_pages = 0;                      // the number of pages total to go through
    public $error = "";                         // if not empty, an error
}

class SimSageSearch
{
    // Set your ids and constants for SimSage (must come from SimSage)
    const organisation_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    const kb_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    // the UK main production server at present  (see https://cloud.simsage.ai/documentation/swagger-ui.html)
    const base_url = 'https://cloud.simsage.ai';
    const api_version = '1';

    // pagination - starting at page 0, etc.
    const page = 0;
    const page_size = 10;

    // sharding - handled by SimSage - just pass through and store - initially empty-list
    private $shard_size_list = [];

    // a few constants - just leave them as they are
    const bot_threshold = 0.8125;         // neural network conversation sensitivity
    const fragment_count = 3;             // number of sub-results per result
    const max_word_distance = 20;         // search algorithm distance betweenw words
    const use_spelling_suggest = false;   // experimental, don't use
    const group_similar_documents = false;   // group documents that are nearly the same together
    const sort_by_age = true;                // sort documents by age instead of relevance first
    const perform_qna_query = true;          // also query the Q&A NLU system
    const semantic_search = true;            // perform the main search (semantic search)

    // fixed client-id to keep track (anonymously) of a client's state
    // keep these the same per client (we tend to use a cookie stored value)
    // makes our statistics / learning algorithms work for you, needs to be random per session
    function get_client_id(): string
    {
        return "6ff9b609-1ddc-4d1d-a98f-07a9d3decb59";
    }

    //
    // helper - post a message using curl and process the result json, return a SimSageResult class
    //
    // @param endPoint string the URL to talk to (without its base)
    // @param data json the data to post for the search
    // @param search_text string the user's search query
    function post_message($endPoint, $data, $search_text): SimSageResult
    {
        $result = new SimSageResult();
        $result->search_text = $search_text;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::base_url . $endPoint);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            "Content-Type: application/json",
            "API-Version: " . self::api_version,
        ));
        // make the call and echo out the result JSON
        $json_result = curl_exec($ch);
        curl_close($ch);

        // process SimSage's results
        $data = json_decode($json_result);
        $result->error = "";
        $result->semantic_search_results = [];
        $result->num_pages = 0;
        $result->num_results = 0;

        // messageType is always "message" for async queries, but could be other types for other async API calls,
        // be-safe and check it
        if ( isset( $data ) && isset( $data->messageType ) && $data->messageType == "message") {
            // the list of results to display (maximum page_size results)
            $result->semantic_search_results = $data->resultList;
            // total number of results (outside pagination)
            $result->num_results = $data->totalDocumentCount;
            // get the page sharding
            $result->shard_size_list = $data->shardSizeList;
            // work out how many pages there are
            $result->num_pages = $data->totalDocumentCount / self::page_size;
            if (round($result->num_pages) != $result->num_pages) {
                $result->num_pages = round($result->num_pages) + 1;
            } else {
                $result->num_pages = round($result->num_pages);
            }

        } else if ( isset( $data) && isset( $data->error) ) {
            $result->error = print_r($data->error, true);
        } else {
            $result->error = "unknown error";
        }
        return $result;
    }

    // perform the search
    // @param text string the text to search on
    // @param search_id string the source id to search on, empty string is all sources
    function do_search( $text, $source_id ): SimSageResult
    {
        // this string is the advanced query-string and is based on the search-text
        // this is used for complex boolean queries and metadata searching - just leave it as this for now
        $search_query_str = '(' . $text . ')';

        // search in data-structure
        $clientQuery = [
            'organisationId' => self::organisation_id,
            'kbList' => [self::kb_id],
            'clientId' => $this->get_client_id(),
            'semanticSearch' => self::semantic_search,
            'qnaQuery' => self::perform_qna_query,
            'query' => $search_query_str,
            'numResults' => 1, // number of bot results, set to 1
            'scoreThreshold' => self::bot_threshold,
            'page' => self::page,
            'pageSize' => self::page_size,
            'shardSizeList' => $this->shard_size_list,
            'fragmentCount' => self::fragment_count,
            'maxWordDistance' => self::max_word_distance,
            'spellingSuggest' => self::use_spelling_suggest,
            'groupSimilarDocuments' => self::group_similar_documents,
            'sortByAge' => self::sort_by_age,
            'sourceId' => $source_id,
        ];
        // do the search
        return $this->post_message('/api/semantic/query', $clientQuery, $text);
    }

}

// example search
$search = new SimSageSearch();
$result = $search->do_search("some keywords", "");

// display the search results or error
if ($result->error != "") {
    echo "error: " . $result->error;
} else {
    // NB. primary and secondary highlights are enclosed in {hl1:} ... {:hl1} and {hl2:} ... {:hl2} tags respectively
    echo "you searched for \"" . $result->search_text . "\"\n";
    echo print_r($result->semantic_search_results, true);
    echo "\n" . $result->num_pages . " pages with a total of " . $result->num_results . " results\n";
}
