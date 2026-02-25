const { assert } = require('chai');
const { getAuthAgent, getAdminAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');

describe('Products Controller', () => {
  let authAgent;
  let adminAgent;
  let testCategory;
  let testToken;
  let filterProductId;
  let filterProductImageUrl;
  before(async function () {
    this.timeout(10_000);
    authAgent = await getAuthAgent();
    adminAgent = await getAdminAgent();

    testCategory = `test-category-${Date.now().toString()}`;
    testToken = `token-${Date.now().toString()}`;
    filterProductImageUrl = `https://example.com/${testToken}.png`;

    const createRes = await adminAgent
      .post('/products')
      .send({
        code: `test-product-${Date.now().toString()}`,
        name: `Filter Product ${testToken}`,
        price: 12.34,
        category: testCategory,
        description: `filter-desc-${testToken}`,
      })
      .expect(201);

    filterProductId = createRes.body.id;

    await adminAgent
      .post(`/products/${filterProductId}/images`)
      .send({ url: filterProductImageUrl })
      .expect(201);
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
    it('should respond with status 400 when required fields are missing', (done) => {
      adminAgent
        .post('/products')
        .send({ name: 'Missing code' })
        .expect(400, done);
    });

    it('should respond with status 201 when a product is created successfully', async () => {
      const res = await adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Test Product',
          price: 19.99,
        })
        .expect(201);

      assert.containsAllKeys(res.body, ['id']);
    });
  });

  describe('/products - PUT', async () => {
    it('should respond with status 400 when no fields are provided to update', (done) => {
      adminAgent.put('/products/1').send({}).expect(400, done);
    });

    it('should respond with status 404 when trying to update a non-existent product', (done) => {
      adminAgent
        .put('/products/999999999')
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

  describe('/products/categories', () => {
    it('should respond with status 200 and include created test category', async () => {
      const res = await request(app).get('/products/categories').expect(200);
      assert.isArray(res.body);
      const match = res.body.find((c) => c && c.name === testCategory);
      assert.isOk(match, 'Expected categories to include the test category');
      assert.isNumber(match.count);
      assert.isAtLeast(match.count, 1);
    });
  });

  describe('/products/list', () => {
    it('should respond with status 200 and return paginated products', async () => {
      const res = await request(app)
        .get('/products/list?limit=10&page=1')
        .expect(200);
      assert.containsAllKeys(res.body, ['data', 'page', 'limit', 'hasNext']);
      assert.isArray(res.body.data);
      assert.strictEqual(res.body.page, 1);
      assert.strictEqual(res.body.limit, 10);
      assert.isBoolean(res.body.hasNext);
      assert.isAtMost(res.body.data.length, 10);
    });

    it('should respond with status 200 and allow filtering by category', async () => {
      const res = await request(app)
        .get(
          `/products/list?limit=10&page=1&categorie=${encodeURIComponent(testCategory)}`,
        )
        .expect(200);

      assert.isArray(res.body.data);
      const match = res.body.data.find(
        (p) => p && String(p.id) === String(filterProductId),
      );
      assert.isOk(match, 'Expected list to include the created filter product');
    });

    it('should respond with status 200 and allow searching by token', async () => {
      const res = await request(app)
        .get(
          `/products/list?limit=10&page=1&search=${encodeURIComponent(testToken)}`,
        )
        .expect(200);

      assert.isArray(res.body.data);
      const match = res.body.data.find(
        (p) => p && String(p.id) === String(filterProductId),
      );
      assert.isOk(
        match,
        'Expected search results to include the created filter product',
      );
    });

    it('should respond with status 200 and return empty data when page exceeds available results for category', async () => {
      const res = await request(app)
        .get(
          `/products/list?limit=10&page=2&categorie=${encodeURIComponent(testCategory)}`,
        )
        .expect(200);

      assert.isArray(res.body.data);
      assert.strictEqual(res.body.data.length, 0);
    });
  });

  describe('/products/:id - GET', () => {
    it('should respond with status 404 for an invalid product ID', (done) => {
      request(app).get('/products/999999999').expect(404, done);
    });

    it('should respond with status 200 and product details for a valid product ID', (done) => {
      request(app)
        .get(`/products/${filterProductId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          assert.isObject(res.body);
          assert.equal(String(res.body.id), String(filterProductId));
          assert.isArray(res.body.image_url);
          assert.isTrue(res.body.image_url.includes(filterProductImageUrl));
          done();
        });
    });
  });

  describe('/products/:id/images', () => {
    it('should respond with status 200 and return image URLs for a product', async () => {
      const res = await request(app)
        .get(`/products/${filterProductId}/images`)
        .expect(200);
      assert.isArray(res.body);
      assert.isTrue(res.body.includes(filterProductImageUrl));
    });

    it('should respond with status 401 if no active session is provided on POST', (done) => {
      request(app)
        .post('/products/1/images')
        .send({ url: 'https://example.com/x.png' })
        .expect(401, done);
    });

    it('should respond with status 403 if POST was called by a non-admin user', (done) => {
      authAgent
        .post('/products/1/images')
        .send({ url: 'https://example.com/x.png' })
        .expect(403, done);
    });

    it('should respond with status 201 when an admin adds a product image', async () => {
      const productRes = await adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Image Product',
          price: 1.23,
        })
        .expect(201);

      const url = `https://example.com/${Date.now().toString()}.png`;
      await adminAgent
        .post(`/products/${productRes.body.id}/images`)
        .send({ url })
        .expect(201);

      const res = await request(app)
        .get(`/products/${productRes.body.id}/images`)
        .expect(200);
      assert.isArray(res.body);
      assert.isTrue(res.body.includes(url));
    });

    it('should respond with status 401 if no active session is provided on DELETE', (done) => {
      request(app)
        .delete('/products/1/images')
        .query({ url: 'https://example.com/x.png' })
        .expect(401, done);
    });

    it('should respond with status 403 if DELETE was called by a non-admin user', (done) => {
      authAgent
        .delete('/products/1/images')
        .query({ url: 'https://example.com/x.png' })
        .expect(403, done);
    });

    it('should respond with status 200 when an admin deletes a product image', async () => {
      const productRes = await adminAgent
        .post('/products')
        .send({
          code: `test-product-${Date.now().toString()}`,
          name: 'Delete Image Product',
          price: 2.34,
        })
        .expect(201);

      const url = `https://example.com/${Date.now().toString()}.png`;
      await adminAgent
        .post(`/products/${productRes.body.id}/images`)
        .send({ url })
        .expect(201);

      await adminAgent
        .delete(`/products/${productRes.body.id}/images`)
        .query({ url })
        .expect(200);

      const res = await request(app)
        .get(`/products/${productRes.body.id}/images`)
        .expect(200);
      assert.isArray(res.body);
      assert.isFalse(res.body.includes(url));
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
