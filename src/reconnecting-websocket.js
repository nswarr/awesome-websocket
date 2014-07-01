log = require('simplog');

var OriginalWebSocket = null;
if ( typeof(WebSocket) === "undefined" ){
  OriginalWebSocket = require("ws");
} else {
  OriginalWebSocket = WebSocket;
}

function sender(data){
  // if the socket isn't open, we'll just reconnect and let the
  // caller try again cause we know this raises an uncatchable
  // error
  if (this.underlyingWs.readyState != OriginalWebSocket.OPEN){
    log.info("this.underlyingWs not open, reconnecting");
    this.reconnect();
    this.ondatanotsent(data);
  } else {
    // otherwise we try to send, and if we have a failure
    // we'll go ahead and reconnect, telling our caller
    // all about how we failed via onsendfailed
    try {
      log.info("sending: ", data);
      this.underlyingWs.send(data);
    } catch (error) {
      log.error("error during send on this.underlyingWs", e);
      this.reconnect();
      this.ondatanotsent(data);
    }
  }
}

function ReconnectingWebSocket(url, protocols){
  RECONNECTING = 99;
  ERRORED = 100;
  // WS Events
  this.onopen    = function () {};
  this.onerror   = function () {};
  this.onclose   = function () {};
  this.onmessage = function () {};

  this.underlyingWs        = null;
  var reconnectOnClose    = true;
  var reconnectAttempts   = 0;
  var readyState         = -1;

  this.ondatanotsent = function() {};
  this.onreconnect = function () {};

  function reconnect() {
    log.info("reconnecting");
    if ( readyState === OriginalWebSocket.CONNECTING ||
         readyState === RECONNECTING || 
         this.underlyingWs.readyState === OriginalWebSocket.CONNECTING )
    {
      return;
    }
    // exponential backoff on delay, capped at a wait of 1024 ms
    var delay = reconnectAttempts++ > 9 ? 1024 : Math.pow(2, reconnectAttempts);
    readyState = RECONNECTING;
    setTimeout(connect, delay);
  }
  // make it 'public' too
  this.reconnect = reconnect.bind(this);

  var connect = function() {
    readyState = OriginalWebSocket.CONNECTING;
    // an attempt to avoid get extraneous events
    // and allow the old socket to be GCd
    if ( this.underlyingWs !== null ){
      this.underlyingWs.onerror = null;
      this.underlyingWs.onmessage = null;
      this.underlyingWs.onclose = null;
      // we don't need to do anything with onopen because it wouldn't
      // fire again anyway, and shouldn't keep the socket from getting
      // GCd
    }
    this.underlyingWs = new OriginalWebSocket(url, protocols || []);
    this.underlyingWs.onopen  = function(evt){
      readyState = OriginalWebSocket.OPEN;
      if ( reconnectAttempts === 0 ) {
        this.onopen(evt);
      } else {
        this.onreconnect();
      }
      reconnectAttempts = 0; // reset
    }.bind(this); 

    // onclose, unless told to close by having our close() method called
    // we'll ignore the close, and reconnect
    this.underlyingWs.onclose = function(evt){
      readyState = OriginalWebSocket.CLOSED;
      if (reconnectOnClose){
        this.reconnect();
      } else {
        this.onclose(evt);
      }
    }.bind(this);

    this.underlyingWs.onerror = function(evt) {
      readyState = ERRORED;
      this.onerror(evt);
    }.bind(this);

    this.underlyingWs.onmessage = function(evt) {
      this.onmessage(evt);
    }.bind(this);
  }.bind(this);

  this.send = sender.bind(this);

  this.close = function () {
    reconnectOnClose = false;
    this.underlyingWs.close();
  }.bind(this);

  setTimeout(connect, 0);
}

function ReconnectingResendingWebSocket(url){
  ReconnectingWebSocket.apply(this, arguments);
  var messages = [];
  var ondatanotsent = function(data) {
    log.info("queueing message for resend");
    messages.push(data);
  }.bind(this);
  var onreconnect = function() { 
    while (messages.length != 0){
      var message = messages.shift();
      this.send(message);
    }
  }.bind(this);

  this.originalondatanotsent = ondatanotsent;
  this.originalonreconnect = onreconnect;
  this.ondatanotsent = ondatanotsent;
  this.onreconnect = onreconnect
  this.send = function()  {
    console.log("this is overridden");
    if ( onreconnect != this.onreconnect || ondatanotsent != this.ondatanotsent ){
      log.error("onreconnect or ondatanotsent have been reassigned, this could break resending!");
    }
    sender.apply(this, arguments);
  }.bind(this);
}
ReconnectingResendingWebSocket.prototype = Object.create(ReconnectingWebSocket.prototype);
ReconnectingResendingWebSocket.constructor = ReconnectingResendingWebSocket;
//
// WS Constants at the 'class' Level
ReconnectingResendingWebSocket.CONNECTING = ReconnectingWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
ReconnectingResendingWebSocket.OPEN = ReconnectingWebSocket.OPEN = OriginalWebSocket.OPEN;
ReconnectingResendingWebSocket.CLOSING = ReconnectingWebSocket.CLOSING = OriginalWebSocket.CLOSING;
ReconnectingResendingWebSocket.CLOSED = ReconnectingWebSocket.CLOSED = OriginalWebSocket.CLOSED;

function MakeWebSocketReconnecting(){
  WebSocket = ReconnectingWebSocket; 
  global.UnMakeWebSocketReconnecting = function(){
    WebSocket = OriginalWebSocket;
    UnMakeWebSocketReconnecting = null;
  };
}

module.exports.MakeWebSocketReconnecting = MakeWebSocketReconnecting;
module.exports.ReconnectingWebSocket = ReconnectingWebSocket;
module.exports.ReconnectingResendingWebSocket = ReconnectingResendingWebSocket;
