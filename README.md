

# WebSocket Additions - `Documentation Woefully Incomplete (DWI)`

### What is this thing?

##### concise

WebSockets should do some stuff out of the box that they don't, this package
attempts to add that.

##### blowhard
It appears useful to add some basic functionality to the native WebSocket.  At
the very least, it appears as if people find themselves coding the same basic
functionality around the native WebSocket as we convert applications to be more
WebSocket centric.  This package intends to be a source of some of that common
functionality bundled up for re-use, to avoid having people need to do the same
things over and over.


### What is this functionality you're speaking of?

* Reconnecting - in the event of the server going down intentionally or otherwise
it's good to have the socket just pickup as if the server were never gone.
* Resending - as a consumer of a WebSocket enabled service, it'd sure be nice if
when you say ws.send('my message') that the message will go, even if the socket
isn't connected when you call 'send'.
* Hunting ( future ) - given a list of hosts, find the fastest available and use
it.

### ASSumptions
It turns out we can make some assumptions in this whole process that make development
a little easier, but may change the way you interact with WebSockets when you 
use this package.

* If you're using the ReconnectingWebSocket, you dont really need access to the
full w3c defined WebSocket interface.
* If you're using the ReconnectingAndResendingWebSocket you don't need access
to the full interface of the ReconnectingWebSocket (specifically `onreconnect`
and `ondatanotsent`).

### You sure it works?

While the only place this currently has been tested is in Chrome (newish versions)
and nodejs, there are some QUnit tests available to prove it does (or doesn't)
work.

```bash
git clone https://github.com/igroff/ws-additions.git
cd ws-additions/
make watch
```

Once you've done that successfully you should find a test page at `http://localhost:8080/index.html`

#### What's a ReconnectingWebSocket look like?

```
[Constructor(DOMString url)]
interface ReconnectingWebSocket : EventTarget {
  attribute WebSocket underlyingWs;

  // ready state
  const unsigned short CONNECTING = 0;
  const unsigned short OPEN = 1;
  const unsigned short CLOSING = 2;
  const unsigned short CLOSED = 3;

  // networking
           attribute EventHandler onopen;
           attribute EventHandler onerror;
           attribute EventHandler onclose;
           attribute EventHandler onreconnect;
  void close([Clamp] optional unsigned short code, optional DOMString reason);

  // messaging
           attribute EventHandler onmessage;
           attribute EventHandler ondatanotsent;
  void send(DOMString data);
  void send(Blob data);
  void send(ArrayBuffer data);
  void send(ArrayBufferView data);
```
#### What's a ReconnectingResendingWebSocket look like?

```
[Constructor(DOMString url)]
interface ReconnectingResendingWebSocket : EventTarget {
  attribute WebSocket underlyingWs;

  // ready state
  const unsigned short CONNECTING = 0;
  const unsigned short OPEN = 1;
  const unsigned short CLOSING = 2;
  const unsigned short CLOSED = 3;

  // networking
           attribute EventHandler onopen;
           attribute EventHandler onerror;
           attribute EventHandler onclose;
  void close([Clamp] optional unsigned short code, optional DOMString reason);

  // messaging
           attribute EventHandler onmessage;
  void send(DOMString data);
  void send(Blob data);
  void send(ArrayBuffer data);
  void send(ArrayBufferView data);
```


### Usage!

This package makes an object that looks a fair bit like a WebSocket available 
to you.  You can consume the functionality in a couple ways, either by explicit
creation of one of these 'enhanced WebSockets' or by replacing the native
WebSocket implementation with the one of your choosing.

First of all, you'll to get the sucker into a format usable by your browser.
'round here we like browserify.

```bash

browserify -r ws-additions --outfile www/js/reconn.js
```

Then in an HTML page somewhere above js/reconn.js

```html
<script src="js/reconn.js"></script>
<script>
  var ReconnectingWebSocket = require("ws-additions").ReconnectingWebSocket;
  var ws = new ReconnectingWebSocket("ws://localhost:8080/socket");
</script>
```

With that, your `ws` will handle reconnecting for you in the event that the 
server at `ws://localhost:8080/socket` disappears.

You can also opt to have it replace the native WebSocket, a polyfill if you will

```html
<script src="js/reconn.js"></script>
<script>
  require("reconnecting-websocket").MakeWebSocketReconnecting();
  // now all your calls to new WebSocket will return 
  // ReconnectingWebSockets!
  var ws = new WebSocket("ws://localhost:8080/socket")
  // woah, that was really dumb I wish to never create another 
  // ReconnectingWebSocket when calling new WebSocket
  UnMakeWebSocketReconnecting();
</script>
```

