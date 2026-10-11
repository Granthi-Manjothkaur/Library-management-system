const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initialData = {
        users: [],
        books: [],
        issues: []
      };

      await writeDB(initialData);
      return initialData;
    }

    throw error;
  }
}

async function writeDB(data) {
  await fs.writeFile(
    DB_PATH,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

module.exports = { readDB, writeDB };