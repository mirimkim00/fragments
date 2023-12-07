const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');
const { readFragmentData } = require('../../src/model/data');

describe('PUT /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).put('/v1/fragments').expect(401));

  test('authenticated user updates the fragment data successfully', async () => {
    const post = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const update = await request(app)
      .put(`/v1/fragments/${post.body.fragment.id}`)
      .send('this is an updated test fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    expect(update.status).toBe(200);
    const fragment = await readFragmentData(hash('user1@email.com'), update.body.fragment.id);

    const req = await request(app)
      .get(`/v1/fragments/${update.body.fragment.id}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(req.body.toString()).toBe(fragment.toString());
  });

  test('authenticated user fails to update fragment data because of different fragment types', async () => {
    const post = await request(app)
      .post('/v1/fragments')
      .send('this is a test fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const update = await request(app)
      .put(`/v1/fragments/${post.body.fragment.id}`)
      .send('this is a failed updated test fragment')
      .set('Content-type', 'text/markdown')
      .auth('user1@email.com', 'password1');

    expect(update.status).toBe(400);

    const req = await request(app)
      .get(`/v1/fragments/${post.body.fragment.id}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(req.body.toString()).toBe('this is a test fragment');
  });

  test('authenticated user fails to update a fragment data with invalid ID', async () => {
    const res = await request(app)
      .put('/v1/fragments/invalidID')
      .auth('user1@email.com', 'password1')
      .send('this is fragment 1 update')
      .set('Content-type', 'text/markdown');

    expect(res.status).toBe(404);
  });
});
