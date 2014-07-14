#! /usr/bin/env node
var express         = require('express');
var child           = require('child_process');
var http            = require('http');
var path            = require('path');
var statichandler   = require('serve-static');
var errorhandler    = require('errorhandler');
var log             = require('simplog');
var _               = require('lodash');

var app = express();
app.use(errorhandler());
app.use(require('body-parser').urlencoded());
app.use(require('body-parser').json());
app.use(statichandler(path.join(__dirname, '../www')));

var server = http.createServer(app);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server, path: "/socket"});
var serverPort = Number(process.env.PORT || 8080);
var allMyChildren = [];


wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    function sendMessage(type, data){
      log.info("(%s) sending: %j", serverPort, data || type);
      if ( typeof(type) === "object" ){
        type.port = serverPort;
        ws.send(JSON.stringify(type));
      } else if ( data ) {
        ws.send(JSON.stringify({type: type, data: data, port:serverPort}));
      } else {
        ws.send(JSON.stringify({type: type, port: serverPort}));
      }
    }
    console.log("handling: " + message); 
    if ( message === "ping" ){
      log.info("pongin'");
      sendMessage("pong");
    } else if ( message === "die" ){
      log.info(" (" + serverPort + ") et, tu, Brute?");
      sendMessage({type: "dying", port:serverPort});
      process.exit(0);
    } else if ( message === "what's your pid" ){
      sendMessage({pid: process.pid});
    } else if ( message === "what's your port" ){
      sendMessage({port: serverPort});
    } else if ( JSON.parse(message) === null ){
      log.info("null message!");
    } else {
      var action = JSON.parse(message);
      if ( action.type === "kill" ){
        if ( action.port ){
          _.each(allMyChildren, function(child) { (child.onPort == action.port) && child.kill(); });
          allMyChildren = _.reject(allMyChildren, function(child){ return child.onPort == action.port; });
        } else if ( action.signal ){
          process.kill(action.pid, action.signal);
        } else {
          process.kill(action.pid);
        } 
      } else if ( action.type === "start" ){
        var childPort = action.port;
        myChild = child.fork(__filename, {env: {PORT: action.port}});
        myChild.on('exit', function(){
          log.info('child exited');
          sendMessage({type: "dead", childPort: childPort});
        });
        myChild.onPort = childPort;
        allMyChildren.push(myChild);
        sendMessage( { type: "started", childPort: action.port, port: action.port, pid: myChild.pid });
      } else if ( action.type === "echo" ){
        sendMessage(action);
      }
    }
  });
  ws.send(JSON.stringify({pid: process.pid, type: 'connected', port: serverPort}));
});

server.listen(serverPort);
