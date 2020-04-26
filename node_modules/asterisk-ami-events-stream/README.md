# Asterisk AMI Events Stream for NodeJS (ES2015) 

[![Build Status](https://travis-ci.org/BelirafoN/asterisk-ami-events-stream.svg?branch=master)](https://travis-ci.org/BelirafoN/asterisk-ami-events-stream)
[![Coverage Status](https://coveralls.io/repos/BelirafoN/asterisk-ami-events-stream/badge.svg)](https://coveralls.io/r/BelirafoN/asterisk-ami-events-stream)
[![Code Climate](https://codeclimate.com/github/BelirafoN/asterisk-ami-events-stream/badges/gpa.svg)](https://codeclimate.com/github/BelirafoN/asterisk-ami-events-stream)
[![npm version](https://badge.fury.io/js/asterisk-ami-events-stream.svg)](https://badge.fury.io/js/asterisk-ami-events-stream)

This is a transform stream for AMI socket. This stream has a three custom events: 

This library is a part of **[Asterisk's AMI Client](https://www.npmjs.com/package/asterisk-ami-client)** library.

* **`amiEvent`** - fired when event was receive. Handler of this event receives AMI event object.
* **`amiResponse`** - fired when response was receive. Handler of this event receives AMI response object. 
* **`amiAction`** - fired when action was receive. Handler of this event receives AMI action object. 

If response from AMI not has structure like this:

```
<KEY>: <VALUE>CRLF
<KEY>: <VALUE>CRLF
...
<KEY>: <VALUE>CRLFx2
```

In above case, body of this response will be available in `$content` property of response object.

### Install 

```bash 
$ npm i asterisk-ami-events-stream
```

### NodeJS versions 

support `>=4.0.0`

### Usage

```javascript
const net = require('net');
const amiUtils = require('asterisk-ami-event-utils');
const AmiEventsStream = require('asterisk-ami-events-stream');
const eventsStream = new AmiEventsStream();

const amiSocket = net.connect({port: 5038}, () => {
        console.log('connected to asterisk ami!');
        amiSocket.write(amiUtils.fromObject({
                Action: 'login',
                Username: 'login',
                Secret: 'password',
                Events: 'on'
            }));
        amiSocket.pipe(eventsStream);
    });
    
amiSocket
    .on('end', () => {
        amiSocket.unpipe(eventsStream);
        console.log('disconnected from asterisk ami');
    })
    .on('error', error => {
        console.log(error);
        amiSocket.unpipe(eventsStream);
    });

eventsStream
    .on('amiEvent', event => {
        console.log(event);
        amiSocket.end();
    })    
    .on('amiResponse', response => {
        console.log(response);
        amiSocket.end();
    })
    .on('amiAction', action => {
        console.log(action);
        amiSocket.end();
    });    
```

### Examples 

For examples, please, see tests `./test/*`.

### Tests 

Tests require [Mocha](https://mochajs.org/). 

```bash 
mocha ./tests
``` 

or with `npm` 

```bash
npm test 
```

Test coverage with [Istanbul](https://gotwarlost.github.io/istanbul/) 

```bash
npm run coverage
```

### License 

Licensed under the MIT License
