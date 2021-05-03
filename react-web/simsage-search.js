import React, {Component} from 'react';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import axios from "axios";

import SingleSearchResult from './single-search-result'

// constants
const api_base = "http://localhost:8080/api";   // the remote SimSage server's location
const pageSize = 10;                            // number of search results per page
const fragmentCount = 3;                        // number of fragments per search result
const scoreThreshold = 0.8125;                  // bot score threshold (0.8125 is a good value)
const maxWordDistance = 20;                     // distance between words in search results for scoring
const numBotResults = 1;                        // number of bot replies, set to 1

// styles of form
const styles = {
    searchPage: {
        margin: '50px',
    },
    searchBar: {
        display: 'inline-block',
    },
    busyBox: {
        marginTop: '10px',
        marginLeft: '10px',
        marginRight: '5px',
        width: '32px',
        float: 'left',
        display: 'inline-block',
    },
    searchTextBox: {
        marginBottom: 16,
        width: '400px',
        float: 'left',
    },
    searchText: {
        width: '400px',
    },
    searchButtonBox: {
        float: 'left',
        marginLeft: '20px',
        marginTop: '14px',
    },
    botResponseBubble: {
        marginLeft: '20px',
        background: 'blue',
        color: 'white',
        borderRadius: '5px',
        width: '600px',
        padding: '10px',
        marginBottom: '10px',
    },
    urlList: {
        marginTop: '10px',
    },
    url: {
        fontSize: '12px',
        cursor: 'pointer',
    },
    searchResultsBox: {
        padding: '10px',
        borderRadius: '4px',
        width: '700px',
        border: '0.5px solid #ccc'
    }
};


export class SimsageSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            has_error: false,

            // search system
            busy: false,
            searchText: '',

            // a result list if applicable after asking
            page: 0,
            has_searched: false,
            search_result_list: [],
            shard_list: [],
            bot_response: '',
            bot_links: [],
        };

    }
    componentDidCatch(error, info) {
        this.setState({ has_error: true });
        console.log(error, info);
    }
    handleSearchTextKeydown(event) {
        if (event.key === "Enter" && this.state.searchText.length > 0) {
            this.doSearch();
        }
    }

    // convert js response to its error output equivalent
    static get_error(error) {
        if (typeof error === "string" && error.indexOf("{") === 0) {
            const obj = JSON.parse(error);
            if (obj && obj["response"] && obj["response"]["data"] && obj["response"]["data"]["error"]) {
                return obj["response"]["data"]["error"];
            } else {
                return error;
            }
        } else {
            if (error && error["response"] && error["response"]["data"] && error["response"]["data"]["error"]) {
                return error["response"]["data"]["error"];
            } else {
                return error;
            }
        }
    }

    static getHeaders() {
        return {
            headers: {
                "API-Version": "1",
                "Content-Type": "application/json"
            }
        };
    }

    static http_post(url, payload, fn_success, fn_fail) {
        axios.post(api_base + url, payload, SimsageSearch.getHeaders())
            .then(function (response) {
                if (fn_success) {
                    fn_success(response);
                }
            })
            .catch(function (error) {
                if (fn_fail) {
                    if (error.response === undefined) {
                        fn_fail('Servers not responding or cannot contact Servers');
                    } else {
                        fn_fail(SimsageSearch.get_error(error));
                    }
                }
            });
    };

    doSearch() {
        // check about and help - special cases
        const self = this;
        if (!self.state.busy) {
            if (this.state.searchText.length > 0) {
                self.setState({busy: true});
                const data = {
                    organisationId: this.props.organisationId,
                    kbList: [this.props.kbId],
                    scoreThreshold: scoreThreshold,
                    clientId: this.props.clientId,
                    semanticSearch: true,
                    query: "(" + this.state.searchText + ")",
                    queryText: this.state.searchText,
                    numResults: numBotResults,
                    page: this.state.page,
                    pageSize: pageSize,
                    shardSizeList: this.state.shard_list,
                    fragmentCount: fragmentCount,
                    maxWordDistance: maxWordDistance,
                    spellingSuggest: false,
                    contextLabel: '',
                    contextMatchBoost: 0.01,
                    sourceId: '',
                };
                SimsageSearch.http_post('/ops/query', data,
                    (result) => {
                        if (result && result.data && result.data.messageType === 'message') {
                            const data = result.data;
                            const shard_list = (data.shardSizeList) ? data.shardSizeList : [];
                            const result_list = (data.resultList) ? data.resultList : [];
                            const bot_response = (data.text) ? data.text : '';
                            const bot_links = (data.urlList) ? data.urlList : [];
                            self.setState({shard_list: shard_list,
                                                 search_result_list: result_list,
                                                 has_searched: true,
                                                 bot_response: bot_response,
                                                 bot_links: bot_links,
                                                 busy: false});
                        } else {
                            self.setState({busy: false});
                        }
                    },
                    (error) => {
                        self.setState({busy: false});
                        if (self.props.onError)
                            self.props.onError('Error', error);
                    }
                )
            }
        }
    }
    openDocument(url) {
        alert("open document " + url);
    }
    render() {
        if (this.state.has_error) {
            return <h1>simsage-search.js: Something went wrong.</h1>;
        }
        return (
            <div style={styles.searchPage}>

                {/* search bar */}
                <div style={styles.searchBar}>
                    <div style={styles.busyBox}>
                        <span style={{'display': this.state.busy ? '' : 'none', width: '32px'}}>&#8987;</span>
                    </div>
                    <div style={styles.searchTextBox}>
                        <TextField
                            autoFocus={true}
                            onChange={(event) => this.setState({searchText: event.target.value})}
                            onKeyPress={(event) => this.handleSearchTextKeydown(event)}
                            label="search"
                            disabled={this.state.busy}
                            style={styles.searchText}
                            value={this.state.searchText}
                        />
                    </div>
                    <div style={styles.searchButtonBox}>
                        <Button variant="contained"
                            color="secondary"
                            disabled={this.state.busy}
                            onClick={() => this.doSearch()}>
                            Search
                        </Button>
                    </div>
                </div>


                {/* bot response display */}
                {this.state.bot_response !== '' &&
                    <div style={styles.botResponseBubble}>

                        <div>{this.state.bot_response}</div>

                        <div style={styles.urlList}>
                            {
                                this.state.bot_links.map((url, index) => {
                                    return (<div key={index} style={styles.url} onClick={() => this.openDocument(url)}>{url}</div>)
                                })
                            }
                        </div>

                    </div>
                }

                {/* search result display */}

                {this.state.search_result_list && this.state.search_result_list.length > 0 &&
                <div>
                    <div style={styles.searchResultsBox}>
                        {
                            this.state.search_result_list.map((item, index) => {
                                return (<SingleSearchResult key={index}
                                                            item={item}
                                                            organisationId={this.props.organisationId}
                                                            kbId={this.props.kbId}
                                                            clientId={this.props.clientId}
                                                            openDocument={(url) => this.openDocument(url)} />)
                            })
                        }
                    </div>
                </div>
                }

                {
                    this.state.search_result_list && this.state.search_result_list.length === 0 &&
                    this.state.has_searched && this.state.bot_response === '' &&
                    <div>no results</div>
                }


            </div>
        );
    }
}

export default SimsageSearch;
