const path = require('path');

process.chdir(path.resolve(__dirname, '..'));
require(path.resolve(__dirname, '../src/server.js'));
