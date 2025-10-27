const path = require('path');

// Здесь укажите абсолютный или относительный путь к базе SQLite вне проекта
// Например, абсолютный путь на вашей системе:
const DB_PATH = path.resolve(__dirname, '../../../278_DB_B04-L04.sqlite');

module.exports = {
  DB_PATH,
};
