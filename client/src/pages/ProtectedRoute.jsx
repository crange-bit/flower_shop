import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
export default function ProtectedRoute({ children, role }) {
	const { token, user } = useSelector((s) => s.auth);
	if (!token) return <Navigate to="/auth" />;
	if (role && user?.role !== role && user?.role !== "admin") {
		return <Navigate to="/" />;
	}
	return children;
}