const { assert } = require('chai');
const { getAuthAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');

describe('Orders Controller', () => {
  let authAgent;
  before(async () => {
    authAgent = await getAuthAgent();
  });

  describe('/orders - Auth', async () => {
    it('should respond with status 401 if no active session is provided on POST', (done) => {
      request(app).post('/orders').expect(401, done);
    });
    it('should respond with status 401 if no active session is provided on GET', (done) => {
      request(app).get('/orders').expect(401, done);
    });
  });

  describe('/orders - POST', async () => {
    it('should respond with status 400 when required fields are missing', (done) => {
      authAgent.post('/orders').send({}).expect(400, done);
    });

    it('should respond with status 201 when an order is created successfully', async () => {
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

      const orderData = {
        addressId: res.body.id,
        items: [
          { productId: 1, quantity: 2, price: 9.99 },
          { productId: 2, quantity: 1, price: 19.99 },
        ],
      };

      await authAgent.post('/orders').send(orderData).expect(201);
    });
  });

  describe('/orders - GET', async () => {
    it('should respond with status 200 and return a list of orders', (done) => {
      authAgent
        .get('/orders')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.isArray(res.body);
          done();
        });
    });
  });
});
