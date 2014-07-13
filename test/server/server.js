#! /usr/bin/env node
var express         = require('express');
var cluster         = require('cluster');
var http            = require('http');
var path            = require('path');
var statichandler   = require('serve-static');
var errorhandler    = require('errorhandler');
var log             = require('simplog');

var app = express();
app.use(errorhandler());
app.use(require('body-parser').urlencoded());
app.use(require('body-parser').json());
app.use(statichandler(path.join(__dirname, '../www')));

var server = http.createServer(app);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server, path: "/socket"});
var serverPort = Number(process.env.PORT || 8080)


wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    function sendMessage(type, data){
      if ( typeof(type) === "object" ){
        ws.send(JSON.stringify(type));
      } else if ( data ) {
        ws.send(JSON.stringify({type: type, data: data}));
      } else {
        ws.send(JSON.stringify({type: type}));
      }
    }
    console.log("handling: " + message); 
    if ( message === "ping" ){
      log.info("pongin'");
      sendMessage("pong");
    } else if ( message === "die" ){
      log.info("et, tu, Brute?");
      process.exit(1);
    } else if ( message === "what's your pid" ){
      sendMessage({pid: process.pid});
    } else if ( message === "what's your port" ){
      sendMessage({port: serverPort});
    } else if ( JSON.parse(message) === null ){
      log.info("null message!");
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
        sendMessage( { type: "started", pid: worker.process.pid });
      } else if ( action.type === "echo" ){
        log.info("echoing: " + message);
        sendMessage(action);
      }
    }
  });
  ws.send(JSON.stringify({type: 'connected'}));
});

server.listen(serverPort);
