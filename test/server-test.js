'use strict';

require('should');

var Promise = require('bluebird');
var fs      = require('fs');
var path    = require('path');
var request = require('request');
var Dorante = require('..');
var del     = Promise.promisify(request.del);
var get     = Promise.promisify(request.get);
var post    = Promise.promisify(request.post);

describe('dorante server', function() {
  var dorante, dorantePort, schema;

  before(function(done) {
    var schemaPath = path.join(__dirname, './fixtures/schema.json');

    fs.readFile(schemaPath, function(err, schemaContents) {
      if (err) throw err;
      schema  = JSON.parse(schemaContents);
      dorante = new Dorante(schema);

      dorante.startServer().then(function() {
        dorantePort = dorante.server.address().port;
        done();
      });
    });
  });

  after(function(done) {
    dorante.stopServer().then(done);
  });

  describe('a basic endpoint with no params', function() {
    var body, path;

    var expectedResponse = {
      allow_tracking: true,
      beta          : false,
      created_at    : '2012-01-01T12:00:00Z',
      email         : 'username@example.com',
      id            : '01234567-89ab-cdef-0123-456789abcdef',
      last_login    : '2012-01-01T12:00:00Z',
      name          : 'Tina Edmonds',
      updated_at    : '2012-01-01T12:00:00Z',
      verified      : false
    };

    beforeEach(function(done) {
      path = 'http://localhost:' + dorantePort + '/account';

      get(path).spread(function(res) {
        body = JSON.parse(res.body);
        done();
      });
    });

    it('responds with a basic response', function() {
      body.should.eql(expectedResponse);
    });
  });

  describe('a basic endpoint with a param', function() {
    var body, path;

    var expectedResponse = {
      created_at : '2012-01-01T12:00:00Z',
      description: 'Causes account to example.',
      doc_url    : 'http://devcenter.heroku.com/articles/example',
      enabled    : true,
      id         : '01234567-89ab-cdef-0123-456789abcdef',
      name       : 'fooFeature',
      state      : 'public',
      updated_at : '2012-01-01T12:00:00Z'
    };

    beforeEach(function(done) {
      path = 'http://localhost:' + dorantePort + '/account/features/fooFeature';

      get(path).spread(function(res) {
        body = JSON.parse(res.body);
        done();
      });
    });

    it('merges the request params with the example response params', function() {
      body.should.eql(expectedResponse);
    });
  });

  describe('an endpoint with nested properties', function() {
    var body, path;

    var expectedResponse = {
      archived_at                   : '2012-01-01T12:00:00Z',
      buildpack_provided_description: 'Ruby/Rack',
      created_at                    : '2012-01-01T12:00:00Z',
      git_url                       : 'git@heroku.com:example.git',
      id                            : '01234567-89ab-cdef-0123-456789abcdef',
      maintenance                   : false,
      name                          : 'my-app-name',
      owner                         : {
        email: 'username@example.com',
        id   : '01234567-89ab-cdef-0123-456789abcdef'
      },
      region                        : {
        id  : '01234567-89ab-cdef-0123-456789abcdef',
        name: 'us'
      },
      released_at                   : '2012-01-01T12:00:00Z',
      repo_size                     : 0,
      slug_size                     : 0,
      stack                         : {
        id  : '01234567-89ab-cdef-0123-456789abcdef',
        name: 'cedar'
      },
      updated_at                    : '2012-01-01T12:00:00Z',
      web_url                       : 'http://example.herokuapp.com/'
    };

    beforeEach(function(done) {
      path = 'http://localhost:' + dorantePort + '/apps/my-app-name';

      get(path).spread(function(res) {
        body = JSON.parse(res.body);
        done();
      });
    });

    it('merges the request params with the example response params', function() {
      body.should.eql(expectedResponse);
    });
  });

  describe('#stub', function() {
    var body, response, path;

    beforeEach(function(done) {
      dorante.stub('GET', '/account', { foo: 'bar' }, 206);

      path = 'http://localhost:' + dorantePort + '/account';

      get(path).spread(function(res) {
        response = res;
        body     = JSON.parse(res.body);
        done();
      });
    });

    it('forces the server to return the stub status code', function() {
      response.statusCode.should.eql(206);
    });

    it('forces the server to return the stub', function() {
      body.should.eql({ foo: 'bar' });
    });

    it('matches only the stubbed method', function(done) {
      del(path).spread(function(res) {
        res.statusCode.should.eql(404);
        done();
      });
    });

    describe('when not given a status code', function() {
      beforeEach(function(done) {
        dorante.stub('POST', '/apps', { foo: 'bar' });

        path = 'http://localhost:' + dorantePort + '/apps';

        post(path, {}).spread(function(res) {
          response = res;
          body     = JSON.parse(res.body);
          done();
        });
      });

      it('uses the default status code', function() {
        response.statusCode.should.eql(201);
      });
    });
  });

  describe('#unstub', function() {
    var account, path;

    beforeEach(function() {
      dorante.stub('GET',  '/account', { foo: 'bar' });
      dorante.stub('POST', '/account', { foo: 'bar' });
      dorante.unstub('POST', '/account');

      account = {
        allow_tracking: true,
        beta          : false,
        created_at    : '2012-01-01T12:00:00Z',
        email         : 'username@example.com',
        id            : '01234567-89ab-cdef-0123-456789abcdef',
        last_login    : '2012-01-01T12:00:00Z',
        name          : 'Tina Edmonds',
        updated_at    : '2012-01-01T12:00:00Z',
        verified      : false
      };
    });

    it('unstubs the given pathname and method', function(done) {
      path = 'http://localhost:' + dorantePort + '/account';

      post(path, {}).spread(function(res) {
        res.statusCode.should.eql(404);
        done();
      });
    });

    it('does not unstub other stubs', function(done) {
      path = 'http://localhost:' + dorantePort + '/account';

      get(path).spread(function(res, body) {
        JSON.parse(body).should.eql({ foo: 'bar' });
        done();
      });
    });
  });

  describe('#unstubAll', function() {
    var account, body;

    beforeEach(function(done) {
      dorante.stub('GET',  '/account', { foo: 'bar' });
      dorante.unstubAll();

      account = {
        allow_tracking: true,
        beta          : false,
        created_at    : '2012-01-01T12:00:00Z',
        email         : 'username@example.com',
        id            : '01234567-89ab-cdef-0123-456789abcdef',
        last_login    : '2012-01-01T12:00:00Z',
        name          : 'Tina Edmonds',
        updated_at    : '2012-01-01T12:00:00Z',
        verified      : false
      };

      get('http://localhost:' + dorantePort + '/account').spread(function(res) {
        body = JSON.parse(res.body);
        done();
      });
    });

    it('unstubs all stubs', function() {
      body.should.eql(account);
    });
  });
});
