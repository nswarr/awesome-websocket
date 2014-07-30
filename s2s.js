require('coffee-script/register')
ws = require('ws')
module.exports.ReconnectingWebSocket = require("./src/reconnecting-websocket.litcoffee")(ws);
module.exports.AwesomeWebSocket = require("./src/awesome-websocket.litcoffee")(ws);
