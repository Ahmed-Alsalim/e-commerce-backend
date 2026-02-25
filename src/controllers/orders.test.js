const { assert } = require('chai');
const { getAuthAgent } = require('../test/testHelpers');
const app = require('../main');
const request = require('supertest');

describe('Orders Controller', () => {
  let authAgent;
  let createdAddress;
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

    it('should respond with status 400 when items are missing', (done) => {
      authAgent.post('/orders').send({ addressId: 1 }).expect(400, done);
    });

    it('should respond with status 400 when items is an empty array', (done) => {
      authAgent.post('/orders').send({ addressId: 1, items: [] }).expect(400, done);
    });

    it('should respond with status 400 when addressId is missing', (done) => {
      authAgent
        .post('/orders')
        .send({ items: [{ productId: 1, quantity: 1, price: 9.99 }] })
        .expect(400, done);
    });

    it('should respond with status 404 when address is not found for user', (done) => {
      authAgent
        .post('/orders')
        .send({
          addressId: 999999999,
          items: [{ productId: 1, quantity: 1, price: 9.99 }],
        })
        .expect(404, done);
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

      createdAddress = { id: res.body.id, ...newAddress };

      const orderData = {
        addressId: res.body.id,
        items: [
          { productId: 1, quantity: 2, price: 9.99 },
          { productId: 2, quantity: 1, price: 19.99 },
        ],
      };

      const orderRes = await authAgent.post('/orders').send(orderData).expect(201);
      assert.containsAllKeys(orderRes.body, ['id']);
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
          assert.isOk(createdAddress, 'Expected a created address from the POST test');
          const matchingOrder = res.body.find(
            (order) =>
              order?.address &&
              String(order.address.id) === String(createdAddress.id),
          );
          assert.isOk(matchingOrder, 'Expected an order to include the full address');
          assert.equal(matchingOrder.address.street1, createdAddress.street1);
          assert.equal(matchingOrder.address.city, createdAddress.city);
          assert.equal(matchingOrder.address.zip, createdAddress.zip);
          assert.equal(matchingOrder.address.country, createdAddress.country);
          assert.isArray(matchingOrder.items);
          if (matchingOrder.items.length > 0) {
            assert.containsAllKeys(matchingOrder.items[0], ['item_id', 'quantity', 'product']);
            assert.containsAllKeys(matchingOrder.items[0].product, [
              'id',
              'name',
              'code',
              'price',
              'description',
              'image',
            ]);
          }
          done();
        });
    });
  });
});
