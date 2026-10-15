const knex = require("knex");
const config = require("../knexfile");

const environment = process.env.NODE_ENV || "development";
const db = knex(config[environment]);

process.on("exit", () => {
	if (db && db.destroy) {
		db.destroy();
	}
});

module.exports = db;