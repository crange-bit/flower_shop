import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/axios";

export const fetchProducts = createAsyncThunk(
	"products/fetch",
	async (params) => {
		const response = await api.get("/products", { params });
		return response.data;
	}
);

export const productSlice = createSlice({
	name: "products",
	initialState: { data: [], page: 1, pages: 1, loading: false },
	reducers: {
		setPage: (s, a) => {
			s.page = a.payload;
		},
	},
	extraReducers: (b) => {
		b.addCase(fetchProducts.pending, (s) => {
			s.loading = true;
		}).addCase(fetchProducts.fulfilled, (s, a) => {
			s.data = a.payload.data;
			s.page = a.payload.page;
			s.pages = a.payload.pages;
			s.loading = false;
		});
	},
});

export const { setPage } = productSlice.actions;
export default productSlice.reducer;