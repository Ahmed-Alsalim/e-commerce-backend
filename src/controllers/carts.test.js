const { assert } = require('chai');
const { getAuthAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');
const { before } = require('mocha');

describe('cart Controller', () => {
  let authAgent;
  before(async () => {
    authAgent = await getAuthAgent();
  });

  beforeEach(async () => {
    await authAgent.delete('/cart').expect(200);
  });

  describe('/cart - Auth', async () => {
    it('should respond with status 401 if no active session is provided on GET', (done) => {
      request(app).get('/cart').expect(401, done);
    });

    it('should respond with status 401 if no active session is provided on POST', (done) => {
      request(app).post('/cart').expect(401, done);
    });
  });

  describe('/cart - POST', async () => {
    it('should respond with status 400 when required fields are missing', (done) => {
      authAgent.post('/cart').send({}).expect(400, done);
    });

    it("should respond with status 200 when an item is added to the user's cart", (done) => {
      authAgent
        .post('/cart')
        .send({ productId: 1, quantity: 2 })
        .expect(200, done);
    });

    it("should respond with status 200 when an item is updated in the user's cart", (done) => {
      authAgent
        .post('/cart')
        .send({ productId: 1, quantity: 5 })
        .expect(200, done);
    });
  });

  describe('/cart - GET', async () => {
    it("should respond with status 200 and return the user's cart", async () => {
      await authAgent
        .post('/cart')
        .send({ productId: 1, quantity: 3 })
        .expect(200);

      await authAgent
        .get('/cart')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
          assert.strictEqual(res.body.length, 1);
          assert.propertyVal(res.body[0], 'product_id', '1');
          assert.propertyVal(res.body[0], 'quantity', 3);
        });
    });
  });

  describe('/cart - DELETE', async () => {
    it("should respond with status 200 when the user's cart is cleared", async () => {
      await authAgent.post('/cart').send({ productId: 1, quantity: 3 });

      await authAgent.delete('/cart').expect(200);

      await authAgent
        .get('/cart')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
          assert.strictEqual(res.body.length, 0);
        });
    });
  });
});
