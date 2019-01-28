module.exports = NanoPeer

function NanoPeer (opts) {
  if (!(this instanceof NanoPeer))
    return new NanoPeer(opts)

  this.peer = null
  this.data = null
  this.opts = opts || {}
  this.q = []
}

NanoPeer.prototype = {
  offer: offer,
  accept: accept,
  send: send,
  close: close,
  add: add,

  handleEvent: handleEvent,
  local: description('setLocalDescription'),
  remote: description('setRemoteDescription')
}

function offer (cb) {
  var np = this

  // Create an RTCPeerConnection and
  // RTCDataChannel on first offer
  if (!np.peer) peer(np)
  if (!np.data) data(np)

  // Create the offer
  resolve(np, 'createOffer', done)

  // Store the offer description locally,
  // but (possibly) wait for ICE candidates
  // to accumulate before notifying the user
  function done (err, offer) {
    cb = cb || noop
    err ? cb.call(np, err) :
    np.local(offer, queue(np, cb))
  }
}

function accept (desc, cb) {
  var np = this
  cb = cb || noop

  // If the offer is initiating communication
  // we should create an RTCPeerConnection
  if (desc.type === 'offer')
    if (!np.peer) peer(np)

  // If we’re accepting an ICE candidate, we
  // don’t have to store a remote description
  if (desc.hasOwnProperty('candidate'))
    return candidate(np, desc, cb)

  np.remote(desc, function (err) {
    if (err) return cb(err)

    // If we’re accepting an answer,
    // this is  the end of the line
    if (desc.type !== 'offer') return cb(null)

    resolve(np, 'createAnswer', done)

    function done (err, answer) {
      err ? cb.call(np, err) :
      np.local(answer, queue(np, cb))
    }
  })
}

function send (msg) {
  this.data.send(msg)
}

function close () {
  this.data.close()
}

function add (track, stream) {
  var np = this

  // Allow adding tracks or whole streams
  stream ? np.peer.addTrack(track, stream) :
  track.getTracks().forEach(function (t) {
    np.peer.addTrack(t, track)
  })
}

function handleEvent (e) {
  var np = this
  var handler = np['on' + e.type]

  // If we’ve received our last ICE candidate
  // we can send any pending offers/answers
  if (e.type === 'icecandidate')
    if (!e.candidate) flush(np)

  // If we’ve accepted an initiating offer
  // we now have an RTCDataChannel to use
  if (e.type === 'datachannel')
    data(np, e.channel)

  // Pass all events through to the user
  handler && handler.call(np, e)
}

function description (fn) {
  return function (desc, cb) {
    var np = this
    var sd = new RTCSessionDescription(desc)
    resolve(np, fn, sd, function (err) {
      err ? cb.call(np, err) :
      cb.call(np, null, sd)
    })
  }
}

function candidate (np, desc) {
  resolve(np,'addIceCandidate',
    new RTCIceCandidate(desc), cb)
}

function peer (np) {
  np.peer = new RTCPeerConnection(np.opts)
  np.peer.addEventListener('icecandidate', np)
  np.peer.addEventListener('negotiationneeded', np)
  np.peer.addEventListener('datachannel', np)
  np.peer.addEventListener('track', np)
}

function data (np, channel) {
  if (!channel) channel = np.peer.createDataChannel(
    Math.random().toString(36).substr(2),
    np.opts)

  np.data = channel
  np.data.addEventListener('open', np)
  np.data.addEventListener('close', np)
  np.data.addEventListener('message', np)
}

function queue (np, cb) {
  // If the user has enabled ICE candidate
  // trickling we can callback immediately
  return np.opts.trickle ? cb : function (err) {
    if (err) return cb.call(np, err)
    np.q.push(cb)
    np.flushed && flush(np)
  }
}

function flush (np) {
  var i = 0
  var total = np.q.length

  // The local description will contain
  // all the ICE candidates at this point
  var desc = np.peer.localDescription

  for (; i < total; i++)
    np.q.shift().call(np, null, desc)

  np.flushed = true
}

function resolve (np, fn, input, cb) {
  if (typeof input === 'function')
    cb = input, input = void 0

  var promise = np.peer[fn](input)
  promise.then(function (res) {
    cb.call(np, null, res)
  },
  function (err) {
    cb.call(np, err)
  })
}

function noop () {}
