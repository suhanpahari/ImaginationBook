import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name : "user", 
    initialState : {
        userEmail : "",
        userPassword : "",
    },
    reducers : {
        setUserEmail : (state, action) => {
            state.userEmail = action.payload;
        },
        setUserPassword : (state, action) => {
            state.userPassword = action.payload;
        },
        clearCredentials: (state) => {
            state.userEmail = "";
            state.userPassword = "";
        }
    },
})

export const { setUserEmail, setUserPassword, clearCredentials } = userSlice.actions;

export default userSlice.reducer;
