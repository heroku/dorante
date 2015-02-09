'use strict';

require('should');

var fs      = require('fs');
var path    = require('path');
var Dorante = require('..');

describe('dorante factories', function() {
  var dorante, schema;

  before(function(done) {
    var schemaPath = path.join(__dirname, './fixtures/schema.json');

    fs.readFile(schemaPath, function(err, schemaContents) {
      if (err) throw err;
      schema  = JSON.parse(schemaContents);
      dorante = new Dorante(schema);
      done();
    });
  });

  describe('for a flat factory with no nested properties', function() {
    var account;

    beforeEach(function() {
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

    describe('when asked for a factory with no properties', function() {
      it('returns the requested factory object', function() {
        dorante.factory('account').should.eql(account);
      });
    });

    describe('when asked for a factory with custom properties', function() {
      beforeEach(function() {
        account = {
          allow_tracking: true,
          beta          : false,
          created_at    : '2012-01-01T12:00:00Z',
          email         : 'custom-user@example.com',
          id            : '01234567-89ab-cdef-0123-456789abcdef',
          last_login    : '2012-01-01T12:00:00Z',
          name          : 'Tina Edmonds',
          updated_at    : '2012-01-01T12:00:00Z',
          verified      : false
        };
      });

      it('returns the requested factory with custom properties', function() {
        dorante.factory('account', { email: 'custom-user@example.com' }).should.eql(account);
      });

      describe('validating the factories', function() {
        describe('when the validateProperties option is true', function() {
          beforeEach(function() {
            dorante.options.validateProperties = true;
          });

          it('should throw when the custom properties are invalid', function() {
            (function() {
              dorante.factory('account-feature', { description: 1 });
            }).should.throw(/InvalidFactory/);

            (function() {
              dorante.factory('account', { allow_tracking: 1 });
            }).should.throw(/InvalidFactory/);
          });

          it('should validate against enums', function() {
            (function() {
              dorante.factory('app-setup', { status: 'notrealstatus' });
            }).should.throw(/InvalidFactory/);
          });
        });

        describe('when the validateProperties option is false', function() {
          beforeEach(function() {
            dorante.options.validateProperties = false;
          });

          it('does not throw for invalid properties', function() {
            (function() {
              dorante.factory('account-feature', { description: 1 });
            }).should.not.throw(/InvalidFactory/);
          });
        });
      });
    });

    it('does not modify factories', function() {
      dorante.factory('account', { foo: 'baz' });

      dorante.factory('account', { baz: 'qux' }).should.eql({
        allow_tracking: true,
        beta          : false,
        created_at    : '2012-01-01T12:00:00Z',
        email         : 'username@example.com',
        id            : '01234567-89ab-cdef-0123-456789abcdef',
        last_login    : '2012-01-01T12:00:00Z',
        name          : 'Tina Edmonds',
        updated_at    : '2012-01-01T12:00:00Z',
        verified      : false,
        baz           : 'qux'
      });
    });
  });

  describe('for a factory with an array property', function() {
    it('returns an array property in its results', function() {
      dorante.factory('build-result').should.eql({
        build    : {
          id    : '01234567-89ab-cdef-0123-456789abcdef',
          status: 'succeeded'
        },
        exit_code: 0,
        lines    : [{
          stream: 'STDOUT',
          line  : '-----> Ruby app detected\n'
        }]
      });
    });
  });

  describe('for a factory with nested properties', function() {
    var app;

    beforeEach(function() {
      app = {
        archived_at                   : '2012-01-01T12:00:00Z',
        buildpack_provided_description: 'Ruby/Rack',
        created_at                    : '2012-01-01T12:00:00Z',
        git_url                       : 'git@heroku.com:example.git',
        id                            : '01234567-89ab-cdef-0123-456789abcdef',
        maintenance                   : false,
        name                          : 'example',
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
    });

    describe('when asked for a factory with no properties', function() {
      it('returns the requested factory object', function() {
        dorante.factory('app').should.eql(app);
      });
    });

    describe('when asked for a factory with custom properties', function() {
      beforeEach(function() {
        app = {
          archived_at                   : '2012-01-01T12:00:00Z',
          buildpack_provided_description: 'Ruby/Rack',
          created_at                    : '2012-01-01T12:00:00Z',
          git_url                       : 'git@heroku.com:example.git',
          id                            : '01234567-89ab-cdef-0123-456789abcdef',
          maintenance                   : false,
          name                          : 'custom-app-name',
          owner                         : {
            email: 'custom-user@example.com',
            id   : '01234567-89ab-cdef-0123-456789abcdef'
          },
          region                        : {
            id  : '01234567-89ab-cdef-0123-456789abcdef',
            name: 'eu'
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
      });

      it('returns the requested factory with custom properties', function() {
        dorante.factory('app', {
          name  : 'custom-app-name',
          owner : {
            email: 'custom-user@example.com'
          },
          region: {
            name: 'eu'
          }
        }).should.eql(app);
      });
    });
  });

  describe('#defineFactory', function() {
    beforeEach(function() {
      dorante.defineFactory('attachment', {
        foo: 'bar'
      });
    });

    it('defines a custom factory', function() {
      dorante.factory('attachment').should.eql({
        foo: 'bar'
      });
    });

    it('can extend custom factories', function() {
      dorante.factory('attachment', { foo: 'baz' }).should.eql({
        foo: 'baz'
      });
    });

    it('does not modify custom factories', function() {
      dorante.factory('attachment', { foo: 'baz' });

      dorante.factory('attachment', { baz: 'qux' }).should.eql({
        foo: 'bar',
        baz: 'qux'
      });
    });
  });
});
