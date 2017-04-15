const jsonDB = require('../index')
const assert = require('assert')
const fs = require('fs-promise')
const rimraf = require('rimraf')

function clearFixtures() {
  rimraf.sync('./test/fixtures/*')
}

describe('JsonDB', function() {
  afterEach(clearFixtures)

  describe('loadAt', function() {
    const path = './test/fixtures/temp.json'

    beforeEach(function() {
      fs.writeJsonSync(path, {
        a: {
          b: {
            c: 'it works!',
            c_array: ['x', 'y', 'z']
          }
        }
      })
    })

    it('loads an object from a JSON stored in a file', function(done) {
      jsonDB
        .loadAt(path)
        .then(function(payload) {
          assert.deepEqual(payload, {
            a: {
              b: {
                c: 'it works!',
                c_array: ['x', 'y', 'z']
              }
            }
          })
        })
        .then(done)
    })

    it('accepts nested paths', function(done) {
      jsonDB
        .loadAt(path, 'a.b.c')
        .then(function(payload) {
          assert.equal(payload, 'it works!')
        })
        .then(done)
    })

    it('accepts array paths', function(done) {
      jsonDB
        .loadAt(path, 'a.b.c_array[0]')
        .then(function(payload) {
          assert.equal(payload, 'x')
        })
        .then(done)
    })

    it('rejects unexisting array indexes', function(done) {
      jsonDB
        .loadAt(path, 'a.b.c_array[3]')
        .catch(function(error) {
          assert.equal(error.message, 'Invalid JSON Path')
        })
        .then(done)
    })

    it('fails when the file does not exist', function(done) {
      jsonDB
        .loadAt('./test/fixtures/unexisting.json')
        .catch(function(error) {
          assert.equal(error.code, 'ENOENT')
        })
        .then(done)
    })

    it('fails when the json path does not exist', function(done) {
      jsonDB
        .loadAt('./test/fixtures/temp.json', 'a.b.c.d')
        .catch(function(error) {
          assert.equal(error.message, 'Invalid JSON Path')
          done()
        })
    })
  })

  describe('writeAt', function() {
    const path = './test/fixtures/temp_write.json'

    beforeEach(function() {
      fs.writeJsonSync(path, {
        a: {
          b: {}
        }
      })
    })

    it('writes at a given path', function(done) {
      const time = new Date().getTime()
      const payload = { c: 'Axios VCR', time: time }

      jsonDB
        .writeAt(path, 'a.b', payload)
        .then(function() {
          return jsonDB.loadAt(path, 'a.b').then(function(json) {
            assert.deepEqual(payload, json)
          })
        })
        .then(done)
    })

    it('creates missing keys', function(done) {
      const payload = 'nested stuff'
      jsonDB
        .writeAt(path, 'a.b.c.d.e', payload)
        .then(function() {
          return jsonDB.loadAt(path, 'a.b.c.d.e').then(function(json) {
            assert.deepEqual(payload, json)
          })
        })
        .then(done)
    })

    it('creates missing parts of the path', function(done) {
      const path = './test/fixtures/nested/temp_write.json'
      const payload = 'something'

      jsonDB
        .writeAt(path, 'a', payload)
        .then(function() {
          return jsonDB.loadAt(path, 'a').then(function(json) {
            assert.deepEqual(payload, json)
          })
        })
        .then(done)
    })
  })
})
