#! /usr/bin/env node
var express         = require('express');
var http            = require('http');
var path            = require('path');
var statichandler   = require('serve-static');
var errorhandler    = require('errorhandler');

var app = express();
app.use(errorhandler());
app.use(require('body-parser').urlencoded());
app.use(require('body-parser').json());
app.use(statichandler(path.join(__dirname, '../www')));

var server = http.createServer(app);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server, path: "/socket"});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log('received: %s', message);
    if ( message === "ping" ){
      console.log("pongin'");
      ws.send("pong");
    } else if ( message === "die" ){
      console.log(wss);
      console.log("et, tu, Brute?");
      process.exit(1);
    }
  });
  ws.send('connected');
});

server.listen(process.env.PORT || 8080);
