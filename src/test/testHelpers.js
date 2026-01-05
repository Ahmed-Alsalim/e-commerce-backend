const request = require('supertest');
const app = require('../main');

async function getAuthAgent() {
  const agent = request.agent(app);

  await agent
    .post('/accounts/login')
    .send({ email: 'user@example.com', password: 'password' })
    .expect(200);

  return agent;
}

module.exports = { getAuthAgent };
