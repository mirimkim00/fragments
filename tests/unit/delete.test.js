const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments', () => {
  test('fragment deleted successfully', async () => {
    const req = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app)
      .delete(`/v1/fragments/${req.body.fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Failed to delete the fragment', async () => {
    const res = await request(app)
      .delete(`/v1/fragments/invalidID`)
      .auth('user1@email.com', 'password1');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });
});
