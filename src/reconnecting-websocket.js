log = require('simplog');

/* This is the function that our implementations will use to send
 * it's out here because we want to use it differently in the various
 * implementations
 */
function sender(data){
  // if the socket isn't open, we'll just reconnect and let the
  // caller try again cause we know this raises an uncatchable
  // error
  if (this.underlyingWs == null || this.underlyingWs.readyState != WebSocket.OPEN){
    log.info("this.underlyingWs not open, reconnecting");
    this.ondatanotsent(new MessageEvent("datanotsent", {data:data}));
    this.reconnect();
  } else {
    // otherwise we try to send, and if we have a failure
    // we'll go ahead and reconnect, telling our caller
    // all about how we failed via onsendfailed
    try {
      log.debug("sending to(%s) : %j", this.underlyingWs.url, data);
      this.underlyingWs.send(data);
      return true; //sent
    } catch (error) {
      log.error(error);
      this.ondatanotsent(new MessageEvent("datanotsent", {data:data}));
      this.reconnect();
    }
  }
  return false; // not sent
}

function ReconnectingWebSocket(url, protocols){
  RECONNECTING = 99;
  ERRORED = 100;
  // WS Events
  this.onopen    = function () {};
  this.onerror   = function () {};
  this.onclose   = function () {};
  this.onmessage = function () {};

  this.underlyingWs       = null;
  var reconnectOnClose    = true;
  var reconnectAttempts   = 0;
  var readyState          = -1;
  var totalConnects       = 0;

  this.ondatanotsent = function() {};
  this.onreconnect = function () {};

  this.reconnect = function() {
    log.debug("reconnecting: ", url);
    if ( readyState === WebSocket.CONNECTING ||
         readyState === RECONNECTING || 
         (this.underlyingWs != null && this.underlyingWs.readyState === WebSocket.CONNECTING ))
    {
      return;
    }
    // exponential backoff on delay, capped at a wait of 1024 ms
    var delay = reconnectAttempts++ > 9 ? 1024 : Math.pow(2, reconnectAttempts);
    readyState = RECONNECTING;
    log.debug("really reconnecting ", delay);
    setTimeout(connect, delay);
  }.bind(this);

  var connect = function() {
    log.info("connecting....");
    readyState = WebSocket.CONNECTING;
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

    this.underlyingWs = new WebSocket(url);
    this.underlyingWs.onopen  = function(evt){
      readyState = WebSocket.OPEN;
      if ( totalConnects === 0 ) {
        this.onopen(evt);
      } else {
        this.onreconnect(new Event('reconnect'));
      }
      reconnectAttempts = 0; // reset
      totalConnects++;
    }.bind(this); 

    this.underlyingWs.onclose = function(evt){
      // onclose, unless told to close by having our close() method called
      // we'll ignore the close, and reconnect
      readyState = WebSocket.CLOSED;
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
    this.underlyingWs.close.apply(this.underlyingWs, arguments);
  }.bind(this);

  setTimeout(connect, 0);
}

/* A handy extension of our reconnecting web socket that will queue up messages
 * and send them if the original attempt is unsuccessful.
 *
 * This one looks a bit like the ReconnectingWebSocket from which it inherits
 * the majority of its functionality with a couple differences.
 *
 * Here we use the ondatanotsent and the onreconnect methods to implement the
 * resend functionality.  This means that those events are not available to the
 * caller, as such we try and detect this error condition and warn about it when
 * sending 
 */
function ReconnectingResendingWebSocket(url){
  ReconnectingWebSocket.apply(this, arguments);
  var unsentMessages = [];
  // we're making 'local' versions of these event handlers because we want
  // to remember them for later comparison during send.  This is so we can be nice
  // and catch people who do things that may break our resending
  var ondatanotsent = function(e) {
    log.info("queueing message for resend");
    unsentMessages.push(e.data);
  }.bind(this);
  var onreconnect = function(e) { 
    log.debug("reconnected, sending any unsent messages");
    while (unsentMessages.length != 0){
      var message = unsentMessages.shift();
      this.send(message);
    }
  }.bind(this);

  // keep track of our originals
  this.originalondatanotsent = ondatanotsent;
  this.originalonreconnect = onreconnect;
  // 'register' our event handlers
  this.ondatanotsent = ondatanotsent;
  this.onreconnect = onreconnect

  // overriding the send method so we can check and see that our required event 
  // handlers are still in place, otherwise we'll let them know but still try 
  // and send as normal ( maybe the change is intentional )
  this.send = function()  {
    log.debug("sending");
    if ( onreconnect != this.onreconnect || ondatanotsent != this.ondatanotsent ){
      log.error("onreconnect or ondatanotsent have been reassigned, this could break resending!");
    }
    sender.apply(this, arguments);
  }.bind(this);
}
ReconnectingResendingWebSocket.prototype = Object.create(ReconnectingWebSocket.prototype);
ReconnectingResendingWebSocket.constructor = ReconnectingResendingWebSocket;

// WS Constants at the 'class' Level.  Adding these since we can replace the
// native WebSocket and we still want people to be able to access them
ReconnectingResendingWebSocket.CONNECTING = ReconnectingWebSocket.CONNECTING = WebSocket.CONNECTING;
ReconnectingResendingWebSocket.OPEN = ReconnectingWebSocket.OPEN = WebSocket.OPEN;
ReconnectingResendingWebSocket.CLOSING = ReconnectingWebSocket.CLOSING = WebSocket.CLOSING;
ReconnectingResendingWebSocket.CLOSED = ReconnectingWebSocket.CLOSED = WebSocket.CLOSED;


module.exports.ReconnectingWebSocket = ReconnectingWebSocket;
module.exports.ReconnectingResendingWebSocket = ReconnectingResendingWebSocket;
