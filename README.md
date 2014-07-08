

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
* Queueing - as a consumer of a WebSocket enabled service, it'd sure be nice if
when you say ws.send('my message') that the message will go, even if the socket
isn't connected when you call 'send'.
* Hunting ( future ) - given a list of hosts, find the fastest available and use
it.

### Assumptions or Making an Ass out of U and Me
It turns out we can make some assumptions in this whole process that make development
a little easier, but may change the way you interact with WebSockets when you 
use this package.

* If you're using the ReconnectingWebSocket, you dont really need access to the
full w3c defined WebSocket interface.
* If you're using the ReconnectingAndResendingWebSocket you don't need access
to the full interface of the ReconnectingWebSocket (specifically `onreconnect`
and `ondatanotsent`).


....



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

        <script src="js/reconn.js"></script>
        <script>
          var ReconnectingWebSocket = require("reconnecting-websocket").ReconnectingWebSocket;
          var ws = new ReconnectingWebSocket("ws://localhost:8080/socket");
        </script>

With that, your `ws` will handle reconnecting for you in the event that the 
server at `ws://localhost:8080/socket` was to disappear.

