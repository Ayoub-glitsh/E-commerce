const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

process.env.JWT_SECRET = 'test_secret';

const VALID_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// App de test minimale avec une route admin protégée
const app = express();
app.get('/admin/dashboard', verifyToken, verifyAdmin, (req, res) => {
  res.status(200).json({ message: 'Bienvenue admin', user: req.user });
});

function makeToken({ userId = VALID_UUID, email = 'admin@test.com', role = 'admin' } = {}) {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Protection des routes admin', () => {
  test("refuse l'accès sans token", async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(401);
  });

  test("refuse l'accès avec un token invalide (signature incorrecte)", async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', 'Bearer token_invalide');
    expect(res.status).toBe(401);
  });

  test("refuse l'accès avec un token expiré", async () => {
    const expiredToken = jwt.sign(
      { userId: VALID_UUID, email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '-10s' }
    );
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test("refuse l'accès si l'ID utilisateur n'est pas un UUID valide", async () => {
    const token = makeToken({ userId: 'id-non-uuid' });
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test("refuse l'accès avec un token valide mais rôle non-admin", async () => {
    const token = makeToken({ role: 'user' });
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("autorise l'accès avec un token valide et rôle admin", async () => {
    const token = makeToken({ role: 'admin' });
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Bienvenue admin');
    expect(res.body.user.role).toBe('admin');
  });

  test('redirige vers /login quand le client attend du HTML (navigateur)', async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Accept', 'text/html');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});