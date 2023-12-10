const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');
const { readFragmentData, listFragments } = require('../../src/model/data');
const fs = require('fs');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users get an empty fragments array', async () => {
    const res = await request(app).get('/v1/fragments/').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toEqual([]);
  });

  test('authenticated user gets fragment by ID', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('This is a testing fragment')
      .set('Content-type', 'text/plain');
    const fragment = await readFragmentData(hash('user1@email.com'), req.body.fragment.id);
    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.text).toBe(fragment.toString());
  });

  test('Return an appropriate error if invalid fragment ID used for the GET request', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalidID')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Unknown Fragment');
  });

  test('successful conversion of html extension to text', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('<h2> Html </h2>')
      .set('Content-type', 'text/html');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('<h2> Html </h2>');
  });

  test('successful conversion of markdown extension to html', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a markdown type fragment')
      .set('Content-type', 'text/markdown');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('<h1>This is a markdown type fragment</h1>\n');
  });

  test('successful conversion of text/markdown(.md) extension to .md', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a markdown type fragment')
      .set('Content-type', 'text/markdown');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.md`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('# This is a markdown type fragment');
  });
  
  test('Get array/list of fragments GET /fragments/?expand=1', async () => {
    await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment 1')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment 2')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    var result = await listFragments(hash('user1@email.com'), 1);
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragments).toEqual(result);
  });

  test('unauthenticated user failed to get all fragments list', async () => {
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('unauthenticated@email.com', 'password1');
    expect(res.statusCode).toBe(401);
  });

  test('Get fragments metadata by valid user ID', async () => {
    const req = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-Type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(req.body).toEqual(res.body);
  });

  test('Get fragments metadata by invalid user ID', async () => {
    const req = await request(app)
      .post('/v1/fragments')
      .send('test fragment')
      .set('Content-Type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}invalid/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  test('Get existing image file by fragment ID', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .set('Content-type', 'image/jpeg')
      .send(fs.readFileSync(`${__dirname}/images/cat1.jpeg`));
    expect(req.status).toBe(201);

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}`)
      .auth('user1@email.com', 'password1');
    expect(res.type).toBe('image/jpeg');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(Buffer.from(fs.readFileSync(`${__dirname}/images/cat1.jpeg`)));
  });

  test('successful conversion of the existing jpg to gif', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .set('Content-type', 'image/jpeg')
      .send(fs.readFileSync(`${__dirname}/images/cat1.jpeg`));
    expect(req.status).toBe(201);

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.gif`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('image/gif');
  });

  test('successful conversion of the existing jpg to webp', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .set('Content-type', 'image/jpeg')
      .send(fs.readFileSync(`${__dirname}/images/cat1.jpeg`));
    expect(req.status).toBe(201);

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.webp`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('image/webp');
  });

  test('successful conversion of the existing jpg to webp', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .set('Content-type', 'image/jpeg')
      .send(fs.readFileSync(`${__dirname}/images/cat1.jpeg`));
    expect(req.status).toBe(201);

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.png`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('image/png');
  });

  test('unsuccessful conversion of text/plain extension to the unsupported extension', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('This is a text type fragment')
      .set('Content-type', 'text/plain');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
  });
});
