const sql = require('mssql');
const { getPool } = require('./connection');

/**
 * Ejecuta una query SELECT y retorna todas las filas.
 * @param {string} sqlText - Query SQL con placeholders @param
 * @param {Array<{name: string, type: any, value: any}>} params - Parámetros tipados
 * @returns {Promise<Array>}
 */
async function query(sqlText, params = []) {
  const pool = getPool();
  const request = pool.request();

  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });

  const result = await request.query(sqlText);
  return result.recordset;
}

/**
 * Ejecuta una query y retorna la primera fila o null.
 * Ideal para SELECT con WHERE por PK o campos únicos.
 */
async function queryOne(sqlText, params = []) {
  const rows = await query(sqlText, params);
  return rows[0] || null;
}

/**
 * Ejecuta INSERT / UPDATE / DELETE.
 * Retorna el número de filas afectadas.
 */
async function execute(sqlText, params = []) {
  const pool = getPool();
  const request = pool.request();

  params.forEach(({ name, type, value }) => {
    request.input(name, type, value);
  });

  const result = await request.query(sqlText);
  return result.rowsAffected[0];
}

/**
 * Ejecuta múltiples queries dentro de una transacción.
 * @param {Function} fn - Callback que recibe un objeto { query, queryOne, execute } ligados a la transacción
 * @returns {Promise<any>} - Lo que retorne fn
 */
async function withTransaction(fn) {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  const txQuery = async (sqlText, params = []) => {
    const request = new sql.Request(transaction);
    params.forEach(({ name, type, value }) => request.input(name, type, value));
    const result = await request.query(sqlText);
    return result.recordset;
  };

  const txQueryOne = async (sqlText, params = []) => {
    const rows = await txQuery(sqlText, params);
    return rows[0] || null;
  };

  const txExecute = async (sqlText, params = []) => {
    const request = new sql.Request(transaction);
    params.forEach(({ name, type, value }) => request.input(name, type, value));
    const result = await request.query(sqlText);
    return result.rowsAffected[0];
  };

  try {
    const result = await fn({ query: txQuery, queryOne: txQueryOne, execute: txExecute });
    await transaction.commit();
    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Re-exportar tipos sql para uso en repositories
module.exports = { query, queryOne, execute, withTransaction, sql };
