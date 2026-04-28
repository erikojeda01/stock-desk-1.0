'use strict';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { connectDB, disconnectDB } = require('../src/config/db');
const createApp = require('../src/app');
const Stock = require('../src/models/Stock');

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
  app = createApp();
  await Stock.create({ symbol: 'AAPL', name: 'Apple Inc.', price: 195, previousClose: 193 });
});

afterAll(async () => {
  await disconnectDB();
  await mongo.stop();
});

describe('Stock Desk API', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/stocks/AAPL', async () => {
    const res = await request(app).get('/api/stocks/AAPL');
    expect(res.status).toBe(200);
    expect(res.body.stock.symbol).toBe('AAPL');
  });

  let accessToken;
  let portfolioId;

  test('register + login + protected route', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Tester', email: 'tester@example.com', password: 'password123' });
    expect(reg.status).toBe(201);
    expect(reg.body.accessToken).toBeTruthy();
    accessToken = reg.body.accessToken;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('tester@example.com');

    const portfolios = await request(app)
      .get('/api/portfolios')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(portfolios.status).toBe(200);
    expect(portfolios.body.portfolios.length).toBeGreaterThan(0); // auto-created default
    portfolioId = portfolios.body.portfolios[0]._id;
  });

  test('buy transaction updates holding + cash', async () => {
    const buy = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ portfolio: portfolioId, symbol: 'AAPL', type: 'BUY', quantity: 2, price: 100 });
    expect(buy.status).toBe(201);

    const summary = await request(app)
      .get(`/api/portfolios/${portfolioId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(summary.status).toBe(200);
    expect(summary.body.holdings.find((h) => h.symbol === 'AAPL').quantity).toBe(2);
  });

  test('rejects invalid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tester@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});
