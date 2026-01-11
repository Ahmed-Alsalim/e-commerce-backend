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
        .send({ email: 'account@abcdefg.com', password: '' })
        .expect(400, done);
    });

    it('should respond with status 201 if account is created successfully', (done) => {
      request(app)
        .post('/accounts/create')
        .send({ email: 'account@abcdefg.com', password: 'password' })
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
        .send({ email: 'account@abcdefg.com', password: '' })
        .expect(401, done);
    });

    it('should respond with status 200 if login is successful', (done) => {
      request(app)
        .post('/accounts/login')
        .send({ email: 'account@abcdefg.com', password: 'password' })
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
          assert.equal(res.body.email, 'user@abcdefg.com');
        });
    });
  });

  describe('/accounts/addresses', () => {
    let authAgent;
    before(async () => {
      authAgent = await getAuthAgent();
    });

    it('should respond with status 401 if no active session is provided', async () => {
      request(app).get('/accounts/addresses').expect(401);
      request(app).post('/accounts/addresses').expect(401);
      request(app).delete('/accounts/addresses/1').expect(401);
    });

    it('should respond with status 200 and addresses array', (done) => {
      authAgent
        .get('/accounts/addresses')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
        })
        .end(done);
    });

    it('should respond with status 201 when a new address is created', (done) => {
      const newAddress = {
        street1: '123 Main St',
        city: 'Anytown',
        zip: '12345',
        country: 'USA',
      };
      authAgent
        .post('/accounts/addresses')
        .send(newAddress)
        .expect(201)
        .expect((res) => {
          assert.containsAllKeys(res.body, ['id']);
        })
        .end(done);
    });

    it('should respond with status 400 when creating an address with no data', (done) => {
      authAgent.post('/accounts/addresses').send({}).expect(400, done);
    });

    it('should respond with status 200 when an address is deleted', async () => {
      const newAddress = {
        street1: '456 Elm St',
        city: 'Othertown',
        zip: '67890',
        country: 'USA',
      };

      const res = await authAgent
        .post('/accounts/addresses')
        .send(newAddress)
        .expect(201);

      await authAgent.delete(`/accounts/addresses/${res.body.id}`).expect(200);
    });
  });
});
