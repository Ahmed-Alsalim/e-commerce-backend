const request = require('supertest');
const app = require('../main');
const { createAdminAccount } = require('../controllers/accounts');

async function getAuthAgent() {
  const agent = request.agent(app);

  await agent
    .post('/accounts/create')
    .send({ email: 'user@abcdefg.com', password: 'password' });

  await agent
    .post('/accounts/login')
    .send({ email: 'user@abcdefg.com', password: 'password' })
    .expect(200);

  return agent;
}

async function getAdminAgent() {
  const agent = request.agent(app);
  const email = 'admin@abcdefg.com';
  const password = 'adminpassword';
  const hashedPassword = await require('../utils/authHelper').hash(password);

  await createAdminAccount(email, hashedPassword);

  await agent.post('/accounts/login').send({ email, password }).expect(200);

  return agent;
}

module.exports = { getAuthAgent, getAdminAgent };
