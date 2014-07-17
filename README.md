

# WebSocket Additions

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
* Hunting - given a list of hosts, connect to them and send messages to which
ever one is available, switching to another if the 'active' connection becomes
unavailable.  Dumb-as-dirt client side fail over.
* KeepAlive - You've gotta have your server do some work for this one, but
it will allow you to set up a message that will be periodically sent back to
the server (to which the server should respond) to keep your connection up
and healthy.

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

Once you've done that successfully you should find a test pages at 
  * `http://localhost:8080/index.html`
  * `http://localhost:8080/hunting.html`
  * `http://localhost:8080/controlled.html`
  * `http://localhost:8080/controlled-resending.html`
A bunch of these tests blow up the server ( by design ) so it's hard to get them
all to run at the same time ( hence the multiple pages ).

### Usage!
This package makes an object that looks a fair bit like a WebSocket available 
to you. 

#### What's a ReconnectingWebSocket look like?

```
[Constructor(DOMString url)]
interface ReconnectingWebSocket : EventTarget {
  attribute WebSocket underlyingWs;

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

#### What's a HuntingWebSocket look like?

```
[Constructor([DOMString url])] - ? that's not right is it ?
interface HuntingWebSocket : EventTarget {
  attribute WebSocket currSocket;

  // networking
          attribute EventHandler onopen;
          attribute EventHandler onerror;
          attribute EventHandler onclose;
          attribute EventHandler onreconnect
  void close();

  // messaging
          attribute EventHandler onmessage;
          attribute EventHandler ondatanotsent;
          attribute EventHandler onsentto;
  void send(DOMString data);
  void send(Blob data);
  void send(ArrayBuffer data);
  void send(ArrayBufferView data);
```

You can consume the functionality in a couple ways, either by explicit
creation of one of these 'enhanced WebSockets' or by replacing the native
WebSocket implementation with the one of your choosing.

First of all, you'll to get the sucker into a format usable by your browser.
'round here we like browserify.

```bash

browserify -r ws-additions --outfile www/js/reconn.js
```

:shit: If you really want to, the most recent browserified version of this thing is down there in `test/www/js/reconn.js`

Then in an HTML page somewhere above js/reconn.js

```html
<script src="js/reconn.js"></script>
<script>
  var ReconnectingWebSocket = require("ws-additions").ReconnectingWebSocket;
  var ws = new ReconnectingWebSocket("ws://localhost:8080/socket");
</script>
```
-- or --
```html
<script src="js/reconn.js"></script>
<script>
  var ReconnectingResendingWebSocket = require("ws-additions").ReconnectingResendingWebSocket;
  var ws = new ReconnectingResendingWebSocket("ws://localhost:8080/socket");
</script>
```
With that, your `ws` will handle reconnecting for you in the event that the 
server at `ws://localhost:8080/socket` disappears.

For hunting, the only real difference is that you need to provide a list of
servers to connect to, if any of them choose to vanish... it'll handle that for
you.

```html
<script src="js/reconn.js"></script>
<script>
    var HuntingWebSocket = require("ws-additions").HuntingWebSocket;
    var testWs = new HuntingWebSocket([
      "ws://localhost:8085/socket",
      "ws://localhost:8086/socket"
    ]);
    testWs.send("this message is AWESOME!");
</script>
```

Proxies have fun with Websockets.  Nginx in particular has a great default that will
kill the connection if it is idle for too long. So you can opt to have these websockets
send pings to your server every so often. It works the same way for each of the
aforementioned sockets, you call keepAlive passing an interval (in ms) and a message
that your server will respond to.

```html
<script src="js/reconn.js"></script>
<script>
  var ReconnectingWebSocket = require("ws-additions").ReconnectingWebSocket;
  var ws = new ReconnectingWebSocket("ws://localhost:8080/socket")
  ws.onopen = function() {
    // this sets up the keep alive
    ws.keepAlive(60 * 1000, "ping!");
  }

</script>
```
