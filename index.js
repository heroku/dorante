'use strict';

var Promise  = require('bluebird');
var http     = require('http');
var request  = require('request');
var steeltoe = require('steeltoe');
var url      = require('url');
var get      = Promise.promisify(request.get);

/**
 * Dorante accepts a JSON schema and stubs an API server based on that schema.
 *
 * @class Dorante
 * @constructor
 * @param {Object} schema the schema to stub an API from
 * @example
 *     var dorante = new Dorante(schema);
 *     dorante.startServer().then(function() {
 *       // Server started...
 *     });
 */
function Dorante(schema) {
  this.schema = schema;
}

/**
 * Build a response form a given path, definition, and link.
 *
 * @method buildResponse
 * @private
 * @param {String} pathname the pathname for the request
 * @param {Object} definition the definition resource being sought
 * @param {Object} link the link representing the request
 */
Dorante.prototype.buildResponse = function doranteBuildResponse(pathname, definition, link) {
  var pathProperties = this.getPropertiesFromPath(pathname, link.href);
  var properties     = this.getPropertiesFromDefinition(pathProperties, definition);
  return properties;
};

/**
 * Get the schema definition for a given path.
 *
 * @method getDefinition
 * @private
 * @param {String} path the path to find a definition for
 * @return {Object} the definition for the path
 * @example
 *     this.getDefinition('/apps/my-app');
 */
Dorante.prototype.getDefinition = function doranteGetDefinition(path) {
  var definition, linkPaths, matchingPath, paths;

  var pathsMatch = function pathsMatch(linkPath) {
    return this.pathsMatch(path, linkPath);
  }.bind(this);

  for (var key in this.schema.definitions) {
    definition   = this.schema.definitions[key];
    linkPaths    = this.getDefinitionLinkPaths(definition);
    matchingPath = arrayFind(linkPaths, pathsMatch);

    if (matchingPath) {
      return definition;
    }
  }

  return null;
};

/**
 * Get the link paths for a given definition.
 *
 * @method getDefinitionLinkPaths
 * @private
 * @param {Object} definition the definition to fetch link paths for
 * @return {Array} the links for this definition
 * @example
 *     this.getDefinitionLinkPaths(appDefinition);
 */
Dorante.prototype.getDefinitionLinkPaths = function doranteGetDefinitionLinkPaths(definition) {
  return definition.links.map(function(link) {
    return link.href;
  });
};

/**
 * Get a link for a given request, pathname, and definition.
 *
 * @method getLink
 * @private
 * @param {String} method the HTTP method to find the link for
 * @param {String} pathname the pathname to find the link for
 * @param {Object} definition the definition to fetch the links from
 */
Dorante.prototype.getLink = function doranteGetLink(method, pathname, definition) {
  var i, link, matchesMethod, matchesPath;

  for (i in definition.links) {
    link          = definition.links[i];
    matchesMethod = method.toUpperCase() === link.method.toUpperCase();
    matchesPath   = this.pathsMatch(pathname, link.href);

    if (matchesMethod && matchesPath) {
      return link;
    }
  }

  return null;
};

/**
 * Given an object of definition properties, return an object of example
 * key/value pairs for that definition.
 *
 * @method getPropertiesFromDefinition
 * @private
 * @param {Object} givenProperties properties to use in the example object
 * @param {Object} definition the definition to pull example properties from
 * @return {Object} an example object for the given definition
 */
Dorante.prototype.getPropertiesFromDefinition = function doranteGetPropertiesFromDefinition(givenProperties, definition) {
  var result = {};
  var property, propertyDefinition;

  for (var key in definition.properties) {
    property = definition.properties[key];

    if (property.properties) {
      result[key] = this.getPropertiesFromDefinition(givenProperties, property);
    } else if (givenProperties[property.$ref]) {
      result[key] = givenProperties[property.$ref];
    } else {
      propertyDefinition = getRef(this.schema, property.$ref);
      result[key] = propertyDefinition.example;
    }
  }

  return result;
};

/**
 * Get an object of schema definition properties from a given path.
 *
 * @method getPropertiesFromPath
 * @private
 * @param {String} pathname the path to pull the properties from
 * @param {String} href the link HREF to compare the path to
 * @return {Object} an object of schema definition properties
 */
Dorante.prototype.getPropertiesFromPath = function doranteGetPropertiesFromPath(pathname, href) {
  var result = {};
  var hrefSegments, pathSegments;

  pathname     = decodeURIComponent(pathname);
  pathSegments = pathname.split(/\//);
  hrefSegments = href.split(/\//);

  hrefSegments.forEach(function(hrefSegment, i) {
    if (hrefSegment.match(/{(.+)}/)) {
      hrefSegment = decodeURIComponent(hrefSegment);
      hrefSegment = hrefSegment.replace(/[{()}]/g, '');

      // FIXME: 'name' isn't always an identity property
      hrefSegment = hrefSegment.replace(/identity$/, 'name');

      result[hrefSegment] = pathSegments[i];
    }
  });

  return result;
};

/**
 * Handle an API request.
 *
 * @method handleRequest
 * @private
 * @param {http.ClientRequest} req the client request
 * @param {http.ServerResponse} res the server resposne
 */
Dorante.prototype.handleRequest = function doranteHandleRequest(req, res) {
  var pathname   = url.parse(req.url).pathname;
  var definition = this.getDefinition(pathname);
  var link       = this.getLink(req.method, pathname, definition);

  if (!link) {
    end({ error: 'Not found' }, 404);
  } else {
    end(this.buildResponse(pathname, definition, link));
  }

  function end(body, statusCode) {
    statusCode = statusCode || 200;
    res.statusCode = statusCode;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  }
};

/**
 * Returns whether or not a path matches another path.
 *
 * @method pathsMatch
 * @private
 * @param {String} pathA a path to match against pathB
 * @param {String} pathB a path to match against pathA
 * @return {Boolean} whether or not pathA matches pathB
 * @example
 *     this.pathsMatch('/apps/my-app', '/apps/{app_identity}');
 */
Dorante.prototype.pathsMatch = function dorantePathsMatch(pathA, pathB) {
  var rawRegex, regex;

  rawRegex = pathB.replace(/{[^\/]+}/g, '[\\w-]+');
  rawRegex = '^' + rawRegex + '$';
  regex    = new RegExp(rawRegex);

  return regex.test(pathA);
};

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
  this.server = http.createServer(this.handleRequest.bind(this));
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

function arrayFind(array, fn) {
  var i, item;

  for (i in array) {
    item = array[i];

    if (fn(item)) {
      return item;
    }
  }

  return null;
}

function getRef(schema, ref) {
  ref = ref.slice(2);
  ref = ref.replace(/\//g, '.');
  return steeltoe(schema).get(ref);
}

module.exports = Dorante;
