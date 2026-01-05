const { assert } = require('chai');
const { getAuthAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');

describe('Accounts Controller', () => {
  before((done) => {
    request(app).delete('/accounts/test/cleanup').expect(200, done);
  });

  describe('/accounts/create', () => {
    it('should respond with status 400 if no username is provided', (done) => {
      request(app)
        .post('/accounts/create')
        .send({ email: '', password: 'password' })
        .expect(400, done);
    });

    it('should respond with status 400 if no password is provided', (done) => {
      request(app)
        .post('/accounts/create')
        .send({ email: 'user@example.com', password: '' })
        .expect(400, done);
    });

    it('should respond with status 201 if account is created successfully', (done) => {
      request(app)
        .post('/accounts/create')
        .send({ email: 'user@example.com', password: 'password' })
        .expect(201, done);
    });
  });

  describe('/accounts/login', () => {
    it('should respond with status 401 if no username is provided', (done) => {
      request(app)
        .post('/accounts/login')
        .send({ email: '', password: 'password' })
        .expect(401, done);
    });

    it('should respond with status 401 if no password is provided', (done) => {
      request(app)
        .post('/accounts/login')
        .send({ email: 'user@example.com', password: '' })
        .expect(401, done);
    });

    it('should respond with status 200 if login is successful', (done) => {
      request(app)
        .post('/accounts/login')
        .send({ email: 'user@example.com', password: 'password' })
        .expect(200, done);
    });
  });

  describe('/accounts/profile', () => {
    it('should respond with status 401 if no active session is provided', (done) => {
      request(app).get('/accounts/profile').expect(401, done);
    });

    it('should respond with status 200 and user profile if active session is provided', async () => {
      const authAgent = await getAuthAgent();

      await authAgent
        .get('/accounts/profile')
        .expect(200)
        .expect((res) => {
          assert.equal(res.body.email, 'user@example.com');
        });
    });
  });
});
