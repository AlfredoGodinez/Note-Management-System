exports.up = function (knex) {
    return knex.schema.createTable('note', function (table) {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      table.string('title').notNullable();
      table.string('content');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('note');
  };