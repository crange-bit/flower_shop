require("dotenv").config();

module.exports = {
	development: {
		client: "pg",
		connection: {
			host: process.env.DB_HOST || "localhost",
			port: process.env.DB_PORT || 5432,
			user: process.env.DB_USER || "postgres",
			password: process.env.DB_PASS || "",
			database: process.env.DB_NAME || "flower_shop",
		},
		migrations: { directory: "./migrations" },
		seeds: { directory: "./seeds" },
	},
	production: {
		client: "pg",
		connection: {
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
		},
		migrations: { directory: "./migrations" },
		seeds: { directory: "./seeds" },
	},
};
