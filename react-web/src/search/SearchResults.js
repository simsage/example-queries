import React from "react";
import './SearchResults.css';
import {SearchResultFragment} from "./SearchResultFragment";
import {useDispatch, useSelector} from "react-redux";
import useInfiniteScroll from 'react-infinite-scroll-hook';
import {
    set_focus_for_preview,
    set_group_similar, set_newest_first,
    update_search_text
} from "../reducers/searchSlice";


/**
 * a container for most of the items on the page, the search-result fragments,
 * the syn-set selector, any metadata selectors, and the source selector
 */
export function SearchResults(props) {
    const dispatch = useDispatch();
    // get state
    const {group_similar, newest_first, last_modified_slider, created_slider,
        syn_set_list, syn_set_values, source_list, spelling_correction, busy, ai_response,
        metadata_list, total_document_count, qna_text, has_more, result_list,
        summaries, search_focus, busy_with_summary, use_ai, busy_with_ai,
    } = useSelector((state) => state.searchReducer);
    const {session} = useSelector((state) => state.authReducer);

    const has_spelling_suggestion = spelling_correction.length > 0;
    const has_search_result = result_list.length > 0;
    const has_qna_result = qna_text.length > 0 || ai_response.length > 0;

    const [sentryRef] = useInfiniteScroll({
        loading: busy,
        hasNextPage: has_more === true,
        onLoadMore: () => { if (has_more === true) search({next_page: true}) },
        // When there is an error, we stop infinite loading.
        // It can be reactivated by setting "error" state as undefined.
        disabled: busy,
        // `rootMargin` is passed to `IntersectionObserver`.
        // We can use it to trigger 'onLoadMore' when the sentry comes near to become
        // visible, instead of becoming fully visible on the screen.
        rootMargin: '0px 0px 400px 0px',
    });

    function search(values) {
        if (props.on_search){
            props.on_search(values);
        }
    }

    function on_set_search_text(text) {
        dispatch(update_search_text(text));
        search({search_text: text, next_page: false});
    }

    function on_set_group_similar(group_similar) {
        dispatch(set_group_similar(group_similar));
        search({group_similar: group_similar, next_page: false, reset_pagination: true});
    }

    function on_set_newest_first(newest_first) {
        dispatch(set_newest_first(newest_first));
        search({newest_first: newest_first, next_page: false, reset_pagination: true});
    }

    let document_count_text = (total_document_count === 1) ? "one result" :
        ((total_document_count > 0) ? ("" + total_document_count + " results") : "No results...");

    const show_preview = (search_focus !== null && window.ENV.show_previews);

    return (
        <div className={(busy && !show_preview) ? "h-100 wait-cursor" : "h-100"}>
            <div className="row mx-0 px-2 results-container overflow-auto h-100 justify-content-center" id="search-results-id">
                <div className="col-xxl-8 col-xl-8 pe-4">
                    { has_spelling_suggestion &&
                        <div className="small text-muted ms-2 fw-light px-3 pb-3">
                            <span>No results.  Did you mean </span>
                            <span className="link-style" onClick={() => on_set_search_text(spelling_correction)}
                                  title={"search for \"" + spelling_correction + "\""}>{spelling_correction}</span>
                            <span>?</span>
                        </div>
                    }
                    { ((!has_qna_result && !has_search_result) || has_search_result) && !has_spelling_suggestion &&
                        <div className="small text-muted ms-2 fw-light px-3 pb-3">
                            { document_count_text }
                        </div>
                    }
                    { has_qna_result &&
                        <div className="p-4 mb-3 mx-2">
                            { ai_response?.length &&
                                <section className="message">
                                    <header></header>
                                    <i></i>
                                    <h2>
                                        {
                                            ai_response.split("\n").map((text, i) => {
                                                return (<div className="dialog-text" key={i}>
                                                        { text.startsWith("http") &&
                                                            <a href={text} target="_blank" rel="noreferrer" className="py-1" title={text}>{text}</a>
                                                        }
                                                        { !text.startsWith("http") &&
                                                            <div className="dialog-text" title={text}>{text}</div>
                                                        }
                                                    </div>
                                                )})
                                        }
                                    </h2>
                                </section>
                            }
                        </div>
                    }

                    {
                        result_list.map( (result, i) => {
                            return (<SearchResultFragment
                                set_focus_for_preview={(result) => dispatch(set_focus_for_preview(result))}
                                session={session}
                                summaries={summaries}
                                source_list={source_list}
                                result={result}
                                use_ai={use_ai}
                                key={i} />)
                        })
                    }

                    { /* infinite scrolling */ }
                    { (busy || has_more) && !busy_with_ai &&
                        <div ref={sentryRef}>
                            {busy_with_summary ? "creating summary..." : "Loading..."}
                        </div>
                    }


                </div>
            </div>
        </div>
    )

}

