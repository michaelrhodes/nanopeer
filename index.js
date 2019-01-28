module.exports = NanoPeer

function NanoPeer (opts) {
  if (!(this instanceof NanoPeer))
    return new NanoPeer(opts)

  this.peer = null
  this.data = null
  this.queue = []
  this.opts = opts || {}
}

NanoPeer.prototype = {
  offer: offer,
  accept: accept,
  send: send,
  close: close,

  handleEvent: handleEvent,
  local: description('setLocalDescription'),
  remote: description('setRemoteDescription'),
  add: candidate('addIceCandidate'),
  defer: defer,
  flush: flush,
}

function offer (cb) {
  cb = cb || noop

  var np = this
  var label = Math.random().toString(36).substr(2)
  np.peer = new RTCPeerConnection(np.opts)
  np.data = np.peer.createDataChannel(label, np.opts)
  np.peer.addEventListener('icecandidate', np)
  np.data.addEventListener('open', np)
  np.data.addEventListener('close', np)
  np.data.addEventListener('message', np)
  resolve.call(np, 'createOffer', done)

  function done (err, offer) {
    err ? cb.call(np, err) :
    np.local(offer, np.defer(cb))
  }
}

function accept (desc, cb) {
  cb = cb || noop

  var np = this

  if (desc.hasOwnProperty('candidate'))
    return np.add(desc, cb)

  if (desc.type === 'offer') {
    np.peer = new RTCPeerConnection(np.opts)
    np.peer.addEventListener('icecandidate', np)
    np.peer.addEventListener('datachannel', np)
  }

  np.remote(desc, function (err) {
    if (err) return cb(err)
    if (desc.type !== 'offer') return cb(null)
    resolve.call(np, 'createAnswer', done)

    function done (err, answer) {
      err ? cb.call(np, err) :
      np.local(answer, np.defer(cb))
    }
  })
}

function send (msg) {
  this.data.send(msg)
}

function close () {
  this.data.close()
}

function defer (cb) {
  var np = this
  return np.opts.trickle ? cb : function (err) {
    if (err) return cb.call(np, err)
    np.queue.push(cb)
    np.flushed && np.flush()
  }
}

function flush () {
  var np = this
  var total = np.queue.length
  var desc = np.peer.localDescription

  for (var i = 0; i < total; i++)
    np.queue.shift().call(np, null, desc)

  np.flushed = true
}

function handleEvent (e) {
  var np = this
  var handler = np['on' + e.type]

  if (e.type === 'icecandidate')
    if (!e.candidate) np.flush()

  if (e.type === 'datachannel') {
    np.data = e.channel
    np.data.addEventListener('open', np)
    np.data.addEventListener('close', np)
    np.data.addEventListener('message', np)
  }

  handler && handler.call(np, e)
}

function candidate (fn) {
  return function (cand, cb) {
    resolve.call(this, fn,
      new RTCIceCandidate(cand), cb)
  }
}

function description (fn) {
  return function (desc, cb) {
    var np = this
    var sd = new RTCSessionDescription(desc)
    resolve.call(np, fn, sd, function (err) {
      err ? cb.call(np, err) :
      cb.call(np, null, sd)
    })
  }
}

function resolve (fn, input, cb) {
  if (typeof input === 'function')
    cb = input, input = void 0

  var np = this
  var promise = np.peer[fn](input)
  promise.then(function (res) {
    cb.call(np, null, res)
  },
  function (err) {
    cb.call(np, err)
  })
}

function noop () {}
