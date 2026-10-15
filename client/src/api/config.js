export const SERVER_URL =
	import.meta.env.VITE_SERVER_URL ||
	(import.meta.env.VITE_API_URL
		? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
		: "http://localhost:4000");

export const API_URL =
	import.meta.env.VITE_API_URL || "http://localhost:4000/api";
