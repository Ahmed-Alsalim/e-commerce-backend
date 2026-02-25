const { assert } = require('chai');

function createResMock() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.body = undefined;
      return this;
    },
  };
}

function loadPaymentController({ sqlExport, stripeFactoryExport }) {
  const dbModuleId = require.resolve('../config/db');
  const stripeModuleId = require.resolve('stripe');
  const paymentModuleId = require.resolve('./payment');

  const originalDb = require.cache[dbModuleId];
  const originalStripe = require.cache[stripeModuleId];
  const originalPayment = require.cache[paymentModuleId];

  require.cache[dbModuleId] = {
    id: dbModuleId,
    filename: dbModuleId,
    loaded: true,
    exports: sqlExport,
  };
  require.cache[stripeModuleId] = {
    id: stripeModuleId,
    filename: stripeModuleId,
    loaded: true,
    exports: stripeFactoryExport,
  };
  delete require.cache[paymentModuleId];

  const controller = require('./payment');

  return {
    controller,
    restore() {
      if (originalDb) require.cache[dbModuleId] = originalDb;
      else delete require.cache[dbModuleId];

      if (originalStripe) require.cache[stripeModuleId] = originalStripe;
      else delete require.cache[stripeModuleId];

      if (originalPayment) require.cache[paymentModuleId] = originalPayment;
      else delete require.cache[paymentModuleId];
    },
  };
}

describe('Payment Controller', () => {
  describe('createCheckoutSession', () => {
    it('should create a session with GBP line items and return clientSecret (no auth)', async () => {
      const sqlStub = async () => [
        { id: 1, name: 'Product A', price: 10, discount: 1 },
        { id: 2, name: 'Product B', price: 20, discount: 0 },
      ];

      let lastCreateParams;
      const stripeStub = {
        checkout: {
          sessions: {
            create: async (params) => {
              lastCreateParams = params;
              return { client_secret: 'cs_test_123' };
            },
          },
        },
      };
      const stripeFactoryStub = () => stripeStub;

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = {
          body: {
            items: [
              { productId: 1, quantity: 2 },
              { productId: 2, quantity: 1 },
            ],
          },
        };
        const res = createResMock();

        await controller.createCheckoutSession(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.deepEqual(res.body, { clientSecret: 'cs_test_123' });
        assert.isOk(lastCreateParams);
        assert.isUndefined(lastCreateParams.customer_email);
        assert.strictEqual(lastCreateParams.mode, 'payment');
        assert.strictEqual(lastCreateParams.ui_mode, 'embedded');
        assert.isString(lastCreateParams.return_url);
        assert.isTrue(lastCreateParams.return_url.includes(process.env.BASE_URL));
        assert.isArray(lastCreateParams.line_items);
        assert.strictEqual(lastCreateParams.line_items.length, 2);
        assert.deepEqual(lastCreateParams.line_items[0], {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Product A' },
            unit_amount: 900,
          },
          quantity: 2,
        });
        assert.deepEqual(lastCreateParams.line_items[1], {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'Product B' },
            unit_amount: 2000,
          },
          quantity: 1,
        });
      } finally {
        restore();
      }
    });

    it('should respond 400 when items are missing', async () => {
      const sqlStub = async () => [];
      const stripeFactoryStub = () => ({
        checkout: { sessions: { create: async () => ({ client_secret: 'x' }) } },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { body: {} };
        const res = createResMock();

        await controller.createCheckoutSession(req, res);

        assert.strictEqual(res.statusCode, 400);
      } finally {
        restore();
      }
    });

    it('should respond 400 when items payload is invalid', async () => {
      const sqlStub = async () => [];
      const stripeFactoryStub = () => ({
        checkout: { sessions: { create: async () => ({ client_secret: 'x' }) } },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { body: { items: [{ productId: 1, quantity: '2' }] } };
        const res = createResMock();

        await controller.createCheckoutSession(req, res);

        assert.strictEqual(res.statusCode, 400);
      } finally {
        restore();
      }
    });

    it('should respond 400 when a productId is invalid', async () => {
      const sqlStub = async () => [{ id: 1, name: 'Only Product', price: 10, discount: 0 }];

      let createCalled = false;
      const stripeFactoryStub = () => ({
        checkout: {
          sessions: {
            create: async () => {
              createCalled = true;
              return { client_secret: 'x' };
            },
          },
        },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { body: { items: [{ productId: 999, quantity: 1 }] } };
        const res = createResMock();

        await controller.createCheckoutSession(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.isFalse(createCalled);
      } finally {
        restore();
      }
    });

    it('should respond 500 when Stripe create throws', async () => {
      const sqlStub = async () => [{ id: 1, name: 'Product A', price: 10, discount: 0 }];
      const stripeFactoryStub = () => ({
        checkout: {
          sessions: {
            create: async () => {
              throw new Error('stripe failed');
            },
          },
        },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { body: { items: [{ productId: 1, quantity: 1 }] } };
        const res = createResMock();

        await controller.createCheckoutSession(req, res);

        assert.strictEqual(res.statusCode, 500);
      } finally {
        restore();
      }
    });
  });

  describe('sessionStatus', () => {
    it('should respond 400 when session_id is missing', async () => {
      const sqlStub = async () => [];
      const stripeFactoryStub = () => ({
        checkout: { sessions: { retrieve: async () => ({ status: 'open', customer_details: {} }) } },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { query: {} };
        const res = createResMock();

        await controller.sessionStatus(req, res);

        assert.strictEqual(res.statusCode, 400);
      } finally {
        restore();
      }
    });

    it('should respond 200 with status and customer_email', async () => {
      const sqlStub = async () => [];
      const stripeFactoryStub = () => ({
        checkout: {
          sessions: {
            retrieve: async () => ({
              status: 'complete',
              customer_details: { email: 'buyer@example.com' },
            }),
          },
        },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { query: { session_id: 'cs_test_abc' } };
        const res = createResMock();

        await controller.sessionStatus(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.deepEqual(res.body, { status: 'complete', customer_email: 'buyer@example.com' });
      } finally {
        restore();
      }
    });

    it('should respond 500 when Stripe retrieve throws', async () => {
      const sqlStub = async () => [];
      const stripeFactoryStub = () => ({
        checkout: {
          sessions: {
            retrieve: async () => {
              throw new Error('stripe retrieve failed');
            },
          },
        },
      });

      const { controller, restore } = loadPaymentController({
        sqlExport: sqlStub,
        stripeFactoryExport: stripeFactoryStub,
      });

      try {
        const req = { query: { session_id: 'cs_test_abc' } };
        const res = createResMock();

        await controller.sessionStatus(req, res);

        assert.strictEqual(res.statusCode, 500);
      } finally {
        restore();
      }
    });
  });
});

