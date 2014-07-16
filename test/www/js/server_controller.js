function SocketServerController(port){
  this.port = port;
  this.servers = {};
  var ReconnectingWebSocket = require("ws-additions").ReconnectingWebSocket;
  var ws = new ReconnectingWebSocket("ws://localhost:" + this.port + "/socket");
  this.connected = Q.defer();

  this.sendMessage = function(message){
    if ( typeof(message) != "string" ){
      ws.send(JSON.stringify(message));
    } else {
      ws.send(message);
    } }.bind(this);
  this.send = this.sendMessage;

  ws.onmessage = function(message){
    message = JSON.parse(message.data);
    if ( message.type === "started" ){
      this.servers[message.childPort].started.resolve();
    } else if ( message.type === "dead" ){
      this.servers[message.childPort].stopped.resolve();
      delete this.servers[message.childPort]
    } else if ( message.type === "connected" ){
      this.connected.resolve();
    } }.bind(this);

  // kills the controlling server
  this.die = function() { this.sendMessage("die") }.bind(this);

  // starts a new server for a given port, or retuns the infor for the one
  // we have
  this.start = function(port) {
    if ( this.servers[port] ){
      return this.servers[port];
    }
    this.servers[port] = { started: Q.defer(), stopped: Q.defer() };
    this.sendMessage({type: "start", port: port});
    return this.servers[port];
  }.bind(this);

  this.kill = function(port){ this.sendMessage({type: "kill", port: port}); return this;}.bind(this);
}
