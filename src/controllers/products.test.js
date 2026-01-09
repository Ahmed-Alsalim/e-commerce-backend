const { assert } = require('chai');
const { getAuthAgent, getAdminAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');

describe('Products Controller', () => {
  let authAgent;
  let adminAgent;
  before(async () => {
    authAgent = await getAuthAgent();
    adminAgent = await getAdminAgent();
  });

  describe('/products - Auth', async () => {
    it('should respond with status 401 if no active session is provided on POST', (done) => {
      request(app).post('/products').expect(401, done);
    });

    it('should respond with status 401 if no active session is provided on PUT', (done) => {
      request(app).put('/products/9999').expect(401, done);
    });

    it('should respond with status 403 if POST was called by a non-admin user', (done) => {
      authAgent.post('/products').expect(403, done);
    });

    it('should respond with status 403 if PUT was called by a non-admin user', (done) => {
      authAgent.put('/products/9999').expect(403, done);
    });
  });

  describe('/products - POST', async () => {
    it('should respond with status 201 when a product is created successfully', (done) => {
      it('should respond with status 400 when required fields are missing', (done) => {
        adminAgent.post('/products').send({ name: '' }).expect(400, done);
      });

      adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Test Product',
          price: 19.99,
        })
        .expect(201, done);
    });
  });

  describe('/products - PUT', async () => {
    it('should respond with status 404 when trying to update a non-existent product', (done) => {
      adminAgent
        .put('/products/9999')
        .send({ name: 'Updated Product', price: 29.99 })
        .expect(404, done);
    });

    it('should respond with status 200 when a product is updated successfully', (done) => {
      adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Product to Update',
          price: 9.99,
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          adminAgent
            .put(`/products/${res.body.id}`)
            .send({ name: 'Updated Product', price: 14.99 })
            .expect(200, done);
        });
    });
  });

  describe('/products/list', () => {
    it('should respond with status 200 and a list of product 1-10', (done) => {
      request(app)
        .get('/products/list?limit=10&offset=0')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
          assert.strictEqual(res.body.length, 10);
          assert.propertyVal(res.body[0], 'id', '1');
          assert.propertyVal(res.body[9], 'id', '10');
        })
        .end(done);
    });

    it('should respond with status 200 and a list of product 11-20', (done) => {
      request(app)
        .get('/products/list?limit=10&offset=10')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
          assert.strictEqual(res.body.length, 10);
          assert.propertyVal(res.body[0], 'id', '11');
          assert.propertyVal(res.body[9], 'id', '20');
        })
        .end(done);
    });

    it('should respond with status 200 and an empty list when offset exceeds total products', (done) => {
      request(app)
        .get('/products/list?limit=10&offset=1000')
        .expect(200)
        .expect((res) => {
          assert.isArray(res.body);
          assert.strictEqual(res.body.length, 0);
        })
        .end(done);
    });
  });

  describe('/products/:id - GET', () => {
    it('should respond with status 404 for an invalid product ID', (done) => {
      request(app).get('/products/9999').expect(404, done);
    });

    it('should respond with status 200 and product details for a valid product ID', (done) => {
      request(app)
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          assert.isObject(res.body);
          assert.equal(res.body.id, 1);
        })
        .end(done);
    });
  });

  describe('/products/:id - DELETE', async () => {
    it('should respond with status 404 when trying to delete a non-existent product', (done) => {
      adminAgent.delete('/products/999999999').expect(404, done);
    });

    it('should respond with status 200 when a product is deleted successfully', (done) => {
      adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Product to Delete',
          price: 9.99,
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          adminAgent.delete(`/products/${res.body.id}`).expect(200, done);
        });
    });
  });
});
