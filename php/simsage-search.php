
<?php

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

  // result data after search in this class
  private $semantic_search_results = [];
  private $num_results = 0;
  private $num_pages = 0;

  // sharding - handled by SimSage - just pass through and store - initially empty-list
  private $shard_size_list = [];

  // a few constants - just leave them as they are
  const bot_threshold = 0.8125;         // neural network conversation sensitivity
  const fragment_count = 3;             // number of sub-results per result
  const max_word_distance = 20;         // search algorithm distance betweenw words
  const use_spelling_suggest = false;   // experimental, don't use


  // fixed client-id to keep track (anonymously) of a client's state
  // keep these the same per client (we tend to use a cookie stored value)
  // makes our statistics / learning algoirthms work for you
  function get_client_id() {
    return uniqid();
  }

  // helper - post a message using jQuery
  function post_message($endPoint, $data, $callback) {
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
    $json_result = curl_exec ($ch);
    curl_close ($ch);
    $callback($json_result);
  }

  // perform the search
  // @param text string the text to search on
  // @param search_id string the source id to search on, empty string is all sources
  function do_search($text, $source_id) {
    // this string is the advanced query-string and is based on the search-text
    // this is used for complex boolean queries and metadata searching - just leave it as this for now
    $search_query_str = '(' . $text . ')';

	  // search in data-structure
	  $clientQuery = [
      'organisationId' => self::organisation_id,
	    'kbList' => [self::kb_id],
	    'clientId' => $this->get_client_id(),
	    'semanticSearch' => true,
      'qnaQuery' => true,
	    'query' => $search_query_str,
	    'numResults' => 1, // number of bot results, set to 1
	    'scoreThreshold' => self::bot_threshold,
	    'page' => self::page,
	    'pageSize' => self::page_size,
	    'shardSizeList' => $this->shard_size_list,
	    'fragmentCount' => self::fragment_count,
	    'maxWordDistance' => self::max_word_distance,
	    'spellingSuggest' => self::use_spelling_suggest,
	    'contextLabel' => '',
	    'contextMatchBoost' => 0.01,
      'groupSimilarDocuments' => false,
      'sortByAge' => true,
	    'sourceId' => $source_id,
	  ];

    // do the search
    $this->post_message('/api/semantic/query', $clientQuery, function($json_data) {
        // process SimSage's results
        $data = json_decode($json_data);
        // messageType is always "message" for async queries, but could be other types for other async API calls,
        // be-safe and check it
        if ($data->messageType == "message") {
            // the list of results to display (maximum page_size results)
            $this->semantic_search_results = $data->resultList;
            // total number of results (outside pagination)
            $this->num_results = $data->totalDocumentCount;
            // get the page sharding
            $this->shard_size_list = $data->shardSizeList;
            // work out how many pages there are
            $this->num_pages = $data->totalDocumentCount / self::page_size;
            if (round($this->num_pages) != $this->num_pages) {
                $this->num_pages = round($this->num_pages) + 1;
            } else {
                $this->num_pages = round($this->num_pages);
            }
            // NB. primary and secondary highlights are enclosed in {hl1:} ... {:hl1} and {hl2:} ... {:hl2} tags respectively
            echo print_r($data->resultList, true);
            echo $this->num_pages . " pages";
            // echo $json_data;
        }
    });
  }

}

// example search
$search = new SimSageSearch();
$search->do_search("some keywords", "");
