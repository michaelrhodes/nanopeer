# nanopeer
handles the webrtc peer connection dance in 741 bytes

## install
```sh
npm install michaelrhodes/nanopeer#1.1.1
```

## use
```js
var peer = require('nanopeer')
var you = peer()
var them = peer()

you.offer(then(function (offer) {
  them.accept(offer, then(function (answer) {
    you.accept(answer)
  }))
}))

you.onopen = function () {
  you.send('ASL?')
}

them.onmessage = function (e) {
  if (e.data === 'ASL?') them.close()
}

you.onclose = function () {
  location.href = 'https://pornhub.com'
}

function then (cb) {
  return function (err, val) {
    err ? alert(err) : cb(val)
  }
}
```

## obey
Copyright 2019 Michael Rhodes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
