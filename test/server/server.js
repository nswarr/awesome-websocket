#! /usr/bin/env node
var express         = require('express');
var cluster         = require('cluster');
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
    if ( message === "ping" ){
      console.log("pongin'");
      ws.send("pong");
    } else if ( message === "die" ){
      console.log("et, tu, Brute?");
      process.exit(1);
    } else if ( message === "what's your pid" ){
      ws.send(JSON.stringify({pid: process.pid}));
    } else {
      var action = JSON.parse(message);
      if ( action.type === "kill" ){
        if ( action.signal ){
          process.kill(action.pid, action.signal);
        } else {
          process.kill(action.pid);
        } 
      } else if ( action.type === "start" ){
        var worker = cluster.fork({PORT: action.port});
        ws.send(JSON.stringify(
          { type: "started", pid: worker.process.pid }
        ));
      }
    }
  });
  ws.send('connected');
});

server.listen(process.env.PORT || 8080);
