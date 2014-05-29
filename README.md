# [dorante][the-liar]

Dorante accepts a JSON schema and provides a stub API server based on it.

## Install

`npm install dorante --save`

## Usage

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

[the-liar]: http://en.wikipedia.org/wiki/The_Liar_(Corneille)
