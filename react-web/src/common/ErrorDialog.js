import React, {useEffect, useCallback} from 'react';

import './ErrorDialog.css';

import {useDispatch, useSelector} from "react-redux";
import {dismiss_auth_error, sign_out} from "../reducers/authSlice";
import {dismiss_search_error} from "../reducers/searchSlice";

let alert_shown = false;

// display error dialog
export function ErrorDialog() {
    const dispatch = useDispatch();

    const {error_message} = useSelector((state) => state.authReducer);
    const {search_error_text} = useSelector((state) => state.searchReducer);

    function on_close_errors() {
        dispatch(dismiss_auth_error());
        dispatch(dismiss_search_error());
    }

    let combined_error = '';
    if (error_message && error_message.length > 0) {
        combined_error = error_message;
    }
    if (search_error_text && search_error_text.length > 0) {
        if (combined_error.length > 0)
            combined_error = combined_error + ' / ' + search_error_text;
        else
            combined_error = search_error_text;
    }


    // session timeout?
    useEffect(() => {
        function help_sign_out() {
            if (search_error_text.indexOf("session timed out") >= 0) {
                if (!alert_shown) {
                    alert("Your session has timed-out.  Please sign-in again.");
                    alert_shown = true;
                }
                dispatch(sign_out());
            } else if (search_error_text.indexOf("ip-address changed") >= 0) {
                if (!alert_shown) {
                    alert("Your session is invalid (ip-address changed).  Please sign-in again.")
                    alert_shown = true;
                }
                dispatch(sign_out());
            }
        }
        help_sign_out()
    }, [search_error_text, dispatch])

    return (
        <div>
            {(error_message.length > 0 || search_error_text.length > 0) &&
                <div className="alert alert-message ps-3 pe-2" role="alert" onClick={() => on_close_errors()}
                     title={combined_error}>
                    <div className="close close-alert px-2" data-dismiss="alert" aria-label="close" title="close">&times;</div>
                    {
                        error_message && error_message.length > 0 && error_message.split("\n").map((text, i) => {
                            return (
                                <div>{text}<br /></div>
                            )
                        })
                    }
                    {
                        search_error_text && search_error_text.length > 0 && search_error_text.split("\n").map((text, i) => {
                            return (
                                <div>{text}<br /></div>
                            )
                        })
                    }
                    <br />
                    <div>Please contact the SimSage Support team if the problem persists</div>
                </div>
            }
        </div>
    )
}
