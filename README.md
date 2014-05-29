# [dorante][the-liar]

[![Build Status](https://travis-ci.org/jclem/dorante.svg?branch=master)](https://travis-ci.org/jclem/dorante)

Dorante accepts a JSON schema and provides a stub API server based on it.

## Install

`npm install dorante --save`

## Usage

### Server

Dorante will start a stub API server when you give it a JSON schema. You can
then make requests to that server, and Dorante will do its best to act like a
real version of the API that the schema represents.

```javascript
var Dorante = require('dorante');
var get     = require('request').get;
var dorante;

get('https://api.example.com/schema', function(err, response, body) {
  var schema = JSON.parse(body);
  dorante = new Dorante(schema);

  dorante.startServer(3000).then(function() {
    var port = dorante.server.address().port;
    console.log('dorante is listening on port ' + port);
  });
});
```

### Factories

Dorante can build factories from your JSON schema:

```javascript
dorante.factory('account');

// {
//   created_at: '2012-01-01T12:00:00Z',
//   name      : 'example-user'
// }

dorante.factory('account', { name: 'custom-app-name' });

// {
//   created_at: '2012-01-01T12:00:00Z',
//   name      : 'custom-user-name'
// }
```

It'll also extend nested properties:

```javascript
dorante.factory('app');

// {
//   created_at: '2012-01-01T12:00:00Z',
//   name      : 'example-app',
//   owner     : {
//     created_at: '2012-01-01T12:00:00Z',
//     name      : 'example-user'
//   }
// }

dorante.factory('app', { name: 'custom-app', { user: name: 'custom-user' } });

// {
//   created_at: '2012-01-01T12:00:00Z',
//   name      : 'custom-app',
//   owner     : {
//     created_at: '2012-01-01T12:00:00Z',
//     name      : 'custom-user'
//   }
// }
```

[the-liar]: http://en.wikipedia.org/wiki/The_Liar_(Corneille)
