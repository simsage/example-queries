import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import axios from "axios";
import {
    get_client_id,
    get_headers,
    get_filters,
    get_time_range_metadata,
    defined,
    pretty_version,
    copy, get_error, add_url_search_parameter, getKbId
} from "../common/Api";

const initialState = {
    shard_list: [],
    result_list: [],

    source_list: [],
    source_values: {},
    source_filter: '',

    has_info: false,            // get info done?

    search_page: 0,             // the current page
    pages_loaded: 0,            // how many pages loaded currently
    num_pages: 0,
    has_more: false,

    total_document_count: 0,
    show_search_results: false,
    group_similar: false,
    newest_first: false,
    busy: false,
    busy_with_summary: false,
    busy_with_ai: false,
    qna_text: '',
    ai_response: '',
    qna_url_list: [],
    search_text: '',
    prev_search_text: '',
    prev_filter: '',
    sr_text: '',                // text return from the search result
    spelling_correction: '',
    entity_values: {},
    hash_tag_list: [],

    // use openAi or equivalent query processors
    use_ai: window.ENV.query_ai_enabled_by_default,
    // the url to focus on for q&A document
    query_ai_focus_url: '',
    query_ai_focus_url_id: 0,
    query_ai_focus_title: '',
    query_ai_dialog_list: [],

    // preview data
    search_focus: null,             // for previewing items
    html_preview_list: [],          // list of preview pages
    has_more_preview_pages: true,    // do we have more pages?

    // date-time sliders
    last_modified_slider: {currentMinValue: 0, currentMaxValue: 0},
    created_slider: {currentMinValue: 0, currentMaxValue: 0},

    // metadata categories down the side
    metadata_list: [],
    metadata_values: {},

    // summarization data
    summaries: {},

    // error handling
    search_error_text: '',

    // syn-sets:  {name: "law", description_list: ['criminal, jail', 'corporate, business']}
    syn_set_list: [],
    syn_set_values: {},
    all_kbs:[]
}

const extraReducers = (builder) => {
    builder
        .addCase(do_search.pending, (state) => {
            state.busy = true;
            if (state.search_page === 0 && state.pages_loaded <= state.search_page) {
                state.result_list = [];
                state.pages_loaded = 0;
                state.ai_response = '';
            }
            state.search_error_text = "";
            state.query_ai_focus_url = "";
            state.query_ai_focus_title = "";
            state.query_ai_dialog_list = [];
        })

        // search result comes in - success
        .addCase(do_search.fulfilled, (state, action) => {
            if (action.payload && defined(action.payload.data) && defined(action.payload.data.page)) {

                const data = action.payload.data;
                const parameters = action.payload.parameters;
                const next_page = action.payload.next_page;
                state.show_search_results = true;

                // this is now the previous search
                state.prev_search_text = data.prev_search_text;
                state.prev_filter = data.prev_filter;

                // add it to the rest (if page > 0) or replace the list?
                let search_result_list;
                let new_result_set = (data && data.resultList && data.resultList.length > 0) ? data.resultList : [];
                if (data.page > 0 || next_page) {
                    search_result_list = state.result_list ? copy(state.result_list) : [];
                    const start = parseInt("" + data.page) * parseInt("" + window.ENV.page_size);
                    for (let i in new_result_set) {
                        const index = parseInt("" + start) + parseInt("" + i);
                        if (index >= parameters.result_list.length) {
                            search_result_list.push(new_result_set[i]);
                        }
                    }
                } else {
                    search_result_list = (data.resultList) ? data.resultList : [];
                }
                state.result_list = search_result_list;
                state.syn_set_list = data.synSetList ? data.synSetList : [];
                state.shard_list = data.shardSizeList ? data.shardSizeList : [];
                state.spelling_correction = data.spellingCorrection ? data.spellingCorrection : '';
                state.hash_tag_list = [];
                state.entity_values = {};
                state.ai_response = data.querySummarization ? data.querySummarization : '';

                // only set the total document count on the first page
                if (data.page === 0) {
                    state.total_document_count = data.totalDocumentCount ? data.totalDocumentCount : 0;
                }

                // set up range slider(s)
                state.last_modified_slider = get_time_range_metadata(data.categoryList, parameters.last_modified_slider, "last-modified");
                state.created_slider = get_time_range_metadata(data.categoryList, parameters.created_slider, "created");

                // collect all other metadata from the collection for display
                state.metadata_list = [];
                const seen = {};
                if (data.categoryList) {
                    for (const item of data.categoryList) {
                        const metadata = item.metadata ? item.metadata : '';
                        if ((item.categoryType === "categorical list" || item.categoryType === "document type") && !seen[metadata]) {
                            seen[metadata] = true;
                            state.metadata_list.push(item);
                        }
                    }
                }

                let has_more = false;
                let divided = (data.totalDocumentCount ? data.totalDocumentCount : 0) / window.ENV.page_size;
                state.search_page = action.payload.data.page;
                let num_pages = 1;
                if (divided > 0) {
                    num_pages = parseInt("" + divided);
                    if (parseInt("" + divided) < divided) {
                        num_pages += 1;
                    }
                    if (num_pages === 0)
                        num_pages = 1;
                    // we have more results to go if there are more pages AND we got a full set of results for this page
                    has_more = (state.search_page + 1 < num_pages) && (new_result_set.length >= window.ENV.page_size);
                }
                state.has_more = has_more;
                state.num_pages = num_pages;

                // set the query string based on the results of the returned search
                add_url_search_parameter("query", parameters.search_text)

                state.pages_loaded = parseInt("" + (state.result_list.length / window.ENV.page_size));
            }
            state.busy = false;
        })

        .addCase(do_search.rejected, (state, action) => {
            state.busy = false;
            state.search_error_text = get_error(action);
            console.error("rejected: do_search:" + state.search_error_text);
        })

        //////////////////////////////////////////////////////////////////////////////////////////

        .addCase(get_info.pending, (state) => {
            state.has_info = false;
            state.busy = true;
            state.search_error_text = "";
        })

        .addCase(get_info.fulfilled, (state, action) => {
            let kb_list = action.payload.kbList ? action.payload.kbList : [];
            state.all_kbs = [...kb_list]
            kb_list = kb_list.filter((kb) => kb.id === getKbId());
            if (kb_list.length === 1) {
                state.source_list = kb_list[0].sourceList ? kb_list[0].sourceList : [];

                // set up range slider(s) and metadata categories
                if (kb_list[0].categoryList) {
                    state.last_modified_slider = get_time_range_metadata(kb_list[0].categoryList, null, "last-modified");
                    state.created_slider = get_time_range_metadata(kb_list[0].categoryList, null, "created");

                    // collect all other metadata from the collection for display
                    state.metadata_list = [];
                    const seen = {};
                    if (kb_list[0].categoryList) {
                        for (const item of kb_list[0].categoryList) {
                            const metadata = item.metadata ? item.metadata : '';
                            if ((item.categoryType === "categorical list" || item.categoryType === "document type") && !seen[metadata]) {
                                seen[metadata] = true;
                                state.metadata_list.push(item);
                            }
                        }
                    }
                }
            }
            state.has_info = true;
            state.busy = false;
        })

        .addCase(get_info.rejected, (state, action) => {
            state.busy = false;
            state.search_error_text = get_error(action);
            console.error("rejected: get_info:" + state.search_error_text);
        })

}


const searchSlice = createSlice({
    name: "search-results",
    initialState,
    // not async function : sync functions
    reducers: {
        go_home: (state) => {
            window.history.replaceState(null, null, window.location.pathname);
            return {...state, show_search_results: false}
        },

        update_search_text: (state, action) => {
            return {...state, search_text: action.payload}
        },

        set_busy: (state, action) => {
            return {...state, busy: action.payload}
        },

        dismiss_search_error: (state) => {
            return {...state, search_error_text: ''}
        },

    },
    extraReducers
})


// get required SimSage information
export const get_info = createAsyncThunk(
    'get_info',
    async({session, user}, {rejectWithValue}) => {

        const user_id = user && user.id ? user.id : get_client_id();
        const api_base = window.ENV.api_base;
        const session_id = (session && session.id) ? session.id : null;
        const url = api_base + '/knowledgebase/search/info/' + encodeURIComponent(window.ENV.organisation_id) + '/' +
                    encodeURIComponent(user_id);
        return axios.get(url, get_headers(session_id))
            .then((response) => {
                console.log('SimSage UX version ' + pretty_version());
                return response.data;
            }).catch((err) => {
                return rejectWithValue(err)
            })
    }
)


// perform a search
export const do_search = createAsyncThunk(
    'do_search',
    async ({
               session,
               user,
               shard_list,
               search_page,
               search_text,
               newest_first,
               group_similar,
               use_ai,
           }, {rejectWithValue}) => {

        const api_base = window.ENV.api_base;
        const session_id = (session && session.id) ? session.id : null;
        const url = session_id ? (api_base + '/dms/query') : (api_base + '/semantic/query');

        const in_parameters = {session, user, search_text, shard_list, group_similar, newest_first};

        const data = {
            organisationId: window.ENV.organisation_id,
            kbList: [getKbId()],
            scoreThreshold: window.ENV.score_threshold,
            clientId: "25eff650-544e-4e25-ad50-fe8e37b6cf43",
            semanticSearch: true,
            query: search_text,
            filter: "",
            numResults: 1,
            page: 0,
            pageSize: window.ENV.page_size,
            shardSizeList: [],
            fragmentCount: window.ENV.fragment_count,
            maxWordDistance: window.ENV.max_word_distance,
            spellingSuggest: window.ENV.use_spell_checker,
            groupSimilarDocuments: group_similar,
            sortByAge: newest_first,
            sourceId: '',
            useQuestionAnsweringAi: use_ai === true,
        };

        if (search_text.trim().length > 0) {
            return axios.post(url, data, get_headers(session_id))
                .then((response) => {
                    if (response && response.data && response.data.messageType === 'message') {
                        response.data.search_text = search_text;
                        response.data.original_text = search_text;
                        response.data.page = 0;
                        response.data.prev_search_text = search_text;
                        response.data.prev_filter = "";
                        return {data: response.data, parameters: in_parameters,
                                next_page: 0, reset_pagination: false};
                    } else {
                        return 'invalid message type:' + response.data.messageType;
                    }
                }).catch((err) => {
                    return rejectWithValue(err)
                })
        }
    }
);


export const {
        go_home, update_search_text, set_focus_for_preview, set_source_value, set_metadata_value,
        dismiss_search_error, set_group_similar, set_newest_first, set_source_filter, select_syn_set,
        set_range_slider, set_metadata_values, set_source_values, close_preview,
        toggle_ai, select_document_for_ai_query, close_query_ai
    } = searchSlice.actions;

export default searchSlice.reducer;

