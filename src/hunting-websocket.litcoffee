This socket is powerful. So powerful that it will try forever to reconnect to
all the specified servers until you call close. It will not give up. It will not
relent.

OK -- so this socket, on send, will roll through all connected sockets, and the
first one that does a successful transport wins. All connected sockets are
possible sources for incoming messages.

If you explicitly call `close()`, then this socket will really close, otherwise
it will work to automatically reconnect `onerror` and `onclose` from the
underlying WebSocket.

#Events
##onserver(event)
This is fired when the active server changes, this will be after a `send` as
that is the only time the socket has activity to 'know' it switched servers.

    ReconnectingWebSocket = require('./reconnecting-websocket.js').ReconnectingWebSocket

    class HuntingWebSocket
      constructor: (@urls) ->
        openAtAll = false
        @currSocket = undefined
        @huntIndex = 0
        @pendingMessages = []
        @sockets = []
        @closed = false
        for url in @urls
          socket = new ReconnectingWebSocket(url)
          @sockets.push socket

Event relay. Maybe I should call it *baton* not *evt*. Anyhow, the
`ReconnectingWebSocket` handles the underlying `WebSocket` so we don't need
to hookup each time we reopen.

          socket.onmessage = (evt) =>
            @onmessage evt
          socket.onerror = (err) =>
            @onerror err
          socket.onopen = (evt) =>
            if not openAtAll
              openAtAll = true
              @currSocket = socket
              @onopen evt
            @onconnectionopen url
          socket.onreconnect = (evt) =>
            @onreconnect evt
            

If there was a problem sending this message, let's try another socket

          socket.ondatanotsent = (evt) =>
            @pendingMessages.push evt.data
            if ++@huntIndex >= @sockets.length
              @huntIndex = 0
            @currSocket = @sockets[@huntIndex]
            @ondatanotsent evt

      send: (data) =>
        if data
          @pendingMessages.push data
        @processPendingMessages()

      processPendingMessages: () =>
        return if @scheduled or @closed
        processMessages = () =>
          while message = @pendingMessages.shift()
            @send(message)
        @scheduled = setInterval processMessages, 500

Setup keep alive on our underlying sockets.  Yup, on each one regardless of
which one(s) are current, you know so they'll all be good if we have to switch

      keepAlive: (intervalInMs, message) =>
        for socket in @sockets
          socket.keepAlive intervalInMs, message

Close all the sockets.

      close: ->
        for socket in @sockets
          socket.close()
        @onclose()

Empty shims for the event handlers. These are just here for discovery via
the debugger.

      onopen: (event) ->
      onreconnect: (event) ->
      onclose: (event) ->
      onmessage: (event) ->
      onerror: (event) ->
      onconnectionopen: (event) ->
      ondatanotsent: (event) ->
      onsentto: (event) ->

Publish this object for browserify.

    module.exports = HuntingWebSocket
