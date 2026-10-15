exports.up = async (knex) => {
	await knex.schema.alterTable("orders", (t) => {
		t.string("purpose").defaultTo("celebration");
	});
};

exports.down = async (knex) => {
	await knex.schema.alterTable("orders", (t) => {
		t.dropColumn("purpose");
	});
};