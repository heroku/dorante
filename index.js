'use strict';

var Promise = require('bluebird');
var http    = require('http');
var request = require('request');
var get     = Promise.promisify(request.get);

/**
 * Dorante accepts a JSON schema and stubs an API server based on that schema.
 *
 * @class Dorante
 * @constructor
 * @param {Object} schema the schema to stub an API from
 * @example
 *     var dorante = new Dorante(schema);
 *     dorante.start().then(function() {
 *       // Server started...
 *     });
 */
function Dorante(schema) {
  this.schema = schema;
}

/**
 * Start a Dorante server.
 *
 * @method startServer
 * @return {Promise} a promise resolved when the server has started
 * @param {Number} port the port to start the server on, defaults to any available
 * @example
 *     dorante.startServer().then(function() {
 *       var port = dorante.server.address().port;
 *     });
 */
Dorante.prototype.startServer = function doranteStartServer(port) {
  this.server = http.createServer(function(req, res) {
    res.end('ok');
  });

  return Promise.promisify(this.server.listen, this.server)(port);
};

/**
 * Stop a Dorante server.
 *
 * @method stopServer
 * @return {Promise} a promise resolved when the server has stopped
 * @example
 *     dorante.stopServer().then(function() {
 *       assert(dorante.server.address() === null);
 *     });
 */
Dorante.prototype.stopServer = function doranteStopServer() {
  return Promise.promisify(this.server.close, this.server)();
};

module.exports = Dorante;
