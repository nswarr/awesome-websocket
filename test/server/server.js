#! /usr/bin/env node
var express         = require('express');
var body_parser     = require('body-parser');
var http            = require('http');
var path            = require('path');
var errorhandler    = require('errorhandler');

var app = express();
app.use(body_parser);
app.use('/', express.static(path.join(__dirname, '../www')));
app.use(errorhandler);

var server = http.createServer(app);

var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log('received: %s', message);
    if ( message === "ping" ){
      ws.send("pong");
    }
  });
  ws.send('connected');
});

server.listen(process.env.PORT || 8080);
