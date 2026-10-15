import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from "./cartSlice";
import productsReducer from "./productSlice";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		cart: cartReducer,
		products: productsReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["auth/logout", "auth/setAuth"],
			},
		}),
});

export const dispatch = store.dispatch;

export default store;