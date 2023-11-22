import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import axios from "axios";
import {get_error, get_headers} from "../common/Api";


const initialState = {
    user: {},
    session: {},
    organisation: {},
    // sign-in menu
    show_menu: false,
    show_kb_menu: false,
    // user wants to sign-in using password auth
    request_sign_on: false,
    // password reset request?
    reset_password_request: false,
    // message from the system to display
    system_message: '',
    // error dialog
    error_message: '',
}

// get the location of the current page without any query parameters - e.g. http://localhost/test/
const location = function() {
    return window.location.protocol + '//' + window.location.host + window.location.pathname;
}

const authSlice = createSlice({
    name: 'auth',
    initialState,

    // not async function : sync functions
    reducers: {

        dismiss_auth_error: (state) => {
            return {...state, error_message: ''}
        },

        dismiss_auth_message: (state) => {
            return {...state, system_message: ''}
        },

        set_auth_error: (state, action) => {
            return {...state, error_message: action.payload.error_text}
        },

        password_sign_in: (state) => {
            window.history.replaceState(null, null, "?"); // remove any query parameters
            return {...state, reset_password_request:false, request_sign_on: true}
        },

        sign_out: (state) => {
            return {...state, session: {}, user: {}, organisation: {}, result_list: [], page: 0,
                    reset_password_request: false, error_message: ''}
        },

    },

    extraReducers: (builder) => {
        builder

            .addCase(signIn.pending, (state, action) => {
                state.error_message = '';
            })

            .addCase(signIn.fulfilled, (state, action) => {
                state.reset_password_request = false;
                if (action.payload.session && action.payload.session.id) {
                    state.request_sign_on = false;
                    state.error_message = '';
                    console.log("signed-in");
                    state.user = action.payload.user;
                    state.session = action.payload.session;
                    if (action.payload.organisationList) {
                        for (const org of action.payload.organisationList) {
                            if (org && org.id === window.ENV.organisation_id) {
                                state.organisation = org;
                                break;
                            }
                        }
                    }
                } else {
                    state.error_message = get_error(action);
                    console.error("password sign-in:" + state.error_message);
                }
            })

            .addCase(signIn.rejected, (state, action) => {
                state.reset_password_request = false;
                state.error_message = get_error(action);
                console.error("rejected: password-sign-in:" + state.error_message);
            })

    }
});

// password based sign-in
export const signIn = createAsyncThunk(
    'authSlice/signIn',
    async ({username, password}, {rejectWithValue}) => {
        const api_base = window.ENV.api_base;
        const url = api_base + '/auth/sign-in';
        return axios.post(url, {"email": username, "password": password}, get_headers(null))
            .then((response) => {
                return response.data;
            }).catch((err) => {
                return rejectWithValue(err)
            })
    }
);


export const {
    dismiss_auth_error, sign_out,
    password_sign_in,
    set_auth_error, dismiss_auth_message
} = authSlice.actions
export default authSlice.reducer;
