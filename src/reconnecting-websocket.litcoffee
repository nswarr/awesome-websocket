This has the exact same API as
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). So
you get going with:

```
ReconnectingWebSocket = require(reconnecting-websocket)
ws = new ReconnectingWebSocket('ws://...');
```

#Events
##ws
A reference to the contained WebSocket in case you need to poke under the hood.

This may work on the client or the server. Because we love you.

    WebSocket = window.WebSocket
    background = window.requestAnimationFrame or setTimeout

    class ReconnectingWebSocket
      constructor: (@url) ->
        @couldBeBusted = true
        @forceclose = false
        @allowReconnect = false
        @wasConnected = false
        @connect()
        @reconnect()

This is the connection retry system. Keep trying at every opportunity.

      reconnect: () ->
        background =>
          @reconnect()
          if not @forceclose
            if @readyState isnt WebSocket.OPEN
              if Date.now() > @reconnectAfter
                @connect()

The all powerful connect function, sets up events and error handling.

      connect: () ->
        @reconnectAfter = Date.now() + 200
        @readyState = WebSocket.CONNECTING
        @ws = new WebSocket(@url)
        @ws.onopen  = (event) =>
          @wasConnected = true
          @readyState = WebSocket.OPEN
          @reconnectAfter = Date.now() * 2
          @onopen(event)
        @ws.onclose = (event) =>
          if @wasConnected
            @ondisconnect(new Event('disconnected', {data: {forceClose: @forceclose}}))
          @reconnectAfter = 0
          if @forceclose
            @readyState = WebSocket.CLOSED
            @onclose(event)
          else
            @readyState = WebSocket.CONNECTING
        @ws.onmessage = (event) =>
          @onmessage(event)
        @ws.onerror = (event) =>
          @reconnectAfter = 0
          @onerror(event)

Sending has an odd uncatchable exception, so use marker flags
to know that we did or did not get past a send.

      send: (data) ->
        state = @readyState
        @readyState = WebSocket.CLOSING
        if typeof(data) is "object"
          @ws.send(JSON.stringify(data))
        else
          @ws.send(data)
        @readyState = state

      close: ->
        @forceclose = true
        @ws.close()

Since there's all sorts of ways your connection can be severed if it's not active
( e.g. nginx ), we'll allow you to specify a keep alive message and an interval
on which to send it.
    
      keepAlive: (timeoutMs, message) ->
        sendMessage = () => @send(message)
        setInterval(sendMessage, timeoutMs)

Empty shims for the event handlers. These are just here for discovery via
the debugger.

      onopen: (event) ->
      onclose: (event) ->
      onmessage: (event) ->
      onerror: (event) ->

As a convenience for testing, we'll emit a message when we've disconnected.

      ondisconnect: (event) ->

Publish this object for browserify.

    module.exports = ReconnectingWebSocket
