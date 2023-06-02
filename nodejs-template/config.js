import { readFileSync } from 'fs';

/**
 *
 * @returns {{
 *      dbPath: string,
 *      createTableSql: string
 * }}
 */
function loadConfig() {
    return JSON.parse(readFileSync('.config.json'));
}

const config = loadConfig();

export { config };
