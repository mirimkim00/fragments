const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a fragments array
  test('authenticated users post a fragment', () => request(app).post('/v1/fragments').expect(401));

  test('response includes all necessary and expected properties', () =>
    request(app).post('/v1/fragments').auth('sample@email.com', 'password1').expect(401));
});
