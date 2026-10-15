import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: JSON.parse(localStorage.getItem("user")) || null,
		token: localStorage.getItem("token"),
	},
	reducers: {
		setAuth: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
			localStorage.setItem("token", action.payload.token);
			localStorage.setItem("user", JSON.stringify(action.payload.user));
		},
		logout: (state) => {
			state.user = null;
			state.token = null;
			localStorage.removeItem("token");
			localStorage.removeItem("user");
		},
	},
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;