import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";

import './Search.css';
import {ErrorDialog} from "../common/ErrorDialog";
import {TitleBar} from "./TitleBar";
import {SearchResults} from "./SearchResults";
import {
    do_search,
    get_info,
    update_search_text
} from "../reducers/searchSlice";

/**
 * Simple search start page manages the display between the first page with the logos
 * and the search result / title page
 *
 */
function Search(props) {
    const dispatch = useDispatch();
    const {show_search_results, search_focus, busy, has_info} = useSelector((state) => state.searchReducer);
    const {shard_list, search_text} = useSelector((state) => state.searchReducer);
    const {session, user} = useSelector((state) => state.authReducer);

    useEffect(() => {
        if (!has_info)
            dispatch(get_info({session: session, user: user}));
    }, [session, user, dispatch, has_info])

    const is_authenticated = session && session.id && session.id.length > 0;

    // perform search
    function search(values) {
        const data = {
            session: session,
            user: user,
            search_text: search_text,
            shard_list: shard_list,
            search_page: 0,
            newest_first: false,
            group_similar: false,
            use_ai: false
        };
        if (values) {
            dispatch(do_search({...data, ...values}));
        } else {
            dispatch(do_search(data));
        }
    }

    return (
        <div className="Search">
            <ErrorDialog />

            <div className={(busy) ? "wait-cursor outer" : "outer"}>

                <TitleBar on_search={() => search({next_page: false})} />

                { show_search_results &&
                    <div className="inner overflow-hidden">
                        <SearchResults on_search={(values) => search(values)} />
                    </div>
                }

            </div>

        </div>
    );
}

export default Search;
