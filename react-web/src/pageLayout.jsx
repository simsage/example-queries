import React, {useEffect} from "react";
import {useDispatch, useSelector} from 'react-redux';
import Search from "./search/Search";
import {signIn} from "./reducers/authSlice";


/**
 * main page layout for the search system
 *
 */
export const PageLayout = () => {
    const dispatch = useDispatch();

    const { session } = useSelector((state) => state.authReducer);

    function on_sign_in(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function on_sign_out(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    useEffect(() => {
        if (!session?.id) {
            dispatch(signIn({"username": window.ENV.email, "password": window.ENV.password}));
        }
    }, [session?.id, dispatch])

    return (
        <div>
            <Search
                on_sign_in={(e) => on_sign_in(e)}
                on_sign_out={(e) => on_sign_out(e)}
            />
        </div>
    )
}
