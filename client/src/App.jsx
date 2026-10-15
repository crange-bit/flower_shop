import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import Navbar from "./pages/Navbar";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import ProtectedRoute from "./pages/ProtectedRoute";
import { Footer, About, Contacts } from "./pages/StaticPages";
import { Auth, ForgotPassword, ResetPassword, VerifyEmail } from "./pages/AuthPages";
import { Profile, Promotions, Reviews } from "./pages/UserPages";

export default function App() {
	return (
		<Provider store={store}>
			<BrowserRouter>
				<div className="app-wrapper">
					<Navbar />
					<main className="main-content">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/catalog" element={<Catalog />} />
							<Route path="/about" element={<About />} />
							<Route path="/contacts" element={<Contacts />} />
							<Route path="/auth" element={<Auth />} />
							<Route
								path="/verify-email"
								element={<VerifyEmail />}
							/>
							<Route
								path="/forgot-password"
								element={<ForgotPassword />}
							/>
							<Route
								path="/reset-password"
								element={<ResetPassword />}
							/>
							<Route path="/reviews" element={<Reviews />} />
							<Route
								path="/promotions"
								element={<Promotions />}
							/>
							<Route
								path="/cart"
								element={
									<ProtectedRoute>
										<Cart />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/checkout"
								element={
									<ProtectedRoute>
										<Checkout />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/profile"
								element={
									<ProtectedRoute>
										<Profile />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/admin"
								element={
									<ProtectedRoute>
										<Admin />
									</ProtectedRoute>
								}
							/>
						</Routes>
					</main>
					<Footer />
				</div>
			</BrowserRouter>
		</Provider>
	);
}