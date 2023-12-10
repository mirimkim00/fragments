const request = require('supertest');
const app = require('../../src/app');

const { readFragment } = require('../../src/model/data');

describe('POST /v1/fragments', () => {
  test('Deny the unauthenticated requests', () => request(app).post('/v1/fragments').expect(401));

  test('Deny the incorrect credentials', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('Authenticated users post a fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
  });

  test('Post unsupported fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-type', 'application/pdf')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Content-Type is not supported');
  });

  test('Response includes all necessary and expected properties', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    const fragment = await readFragment(res.body.fragment.ownerId, res.body.fragment.id);
    expect(res.body.fragment).toEqual(fragment);
  });

  test('Post text/plain content-type with charset', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain; charset=utf-8')
      .auth('user1@email.com', 'password1');
    const fragment = await readFragment(res.body.fragment.ownerId, res.body.fragment.id);
    expect(res.body.fragment).toEqual(fragment);
    expect(res.statusCode).toBe(201);
  });
});
