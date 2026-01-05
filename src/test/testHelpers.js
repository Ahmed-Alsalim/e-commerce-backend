const request = require('supertest');
const app = require('../main');

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

  await agent.post('/accounts/create').send({
    email: 'admin@abcdefg.com',
    password: 'password',
    is_admin: true,
  });

  await agent
    .post('/accounts/login')
    .send({ email: 'admin@abcdefg.com', password: 'adminpassword' })
    .expect(200);

  return agent;
}

module.exports = { getAuthAgent, getAdminAgent };
