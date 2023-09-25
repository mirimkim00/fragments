const request = require('supertest');

const app = require('../../src/app');

describe("requests for resources that can't be found", () => {
  test('404 handler ', () => request(app).get('/does-not-exist').expect(404));
});
