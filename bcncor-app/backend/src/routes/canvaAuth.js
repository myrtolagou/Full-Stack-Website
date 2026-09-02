/**
 * routes/canvaAuth.js
 *
 * Canva OAuth 2.0 with PKCE flow.
 *
 *  GET  /auth/canva             → redirect to Canva authorization URL
 *  GET  /auth/canva/callback    → exchange code for token, persist to disk
 *  GET  /auth/canva/status      → { connected: true/false }
 *  POST /auth/canva/disconnect  → clear stored token
 */

const { Router } = require('express');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const axios      = require('axios');
const { env }    = require('../config/env');

const router = Router();

// ── Persistent token store ────────────────────────────────────────────────────
const TOKEN_FILE = path.join(__dirname, '../../.canva-token.json');

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

function saveStore(data) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data), 'utf8');
}

const store = loadStore();

// ── PKCE helpers ──────────────────────────────────────────────────────────────
let pendingVerifier = null;

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ── GET /auth/canva ───────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  const verifier  = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  pendingVerifier = verifier;

  const params = new URLSearchParams({
    client_id:             env.CANVA_CLIENT_ID,
    response_type:         'code',
    redirect_uri:          env.CANVA_REDIRECT_URI,
    scope:                 'design:content:read design:content:write design:meta:read profile:read',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`);
});

// ── GET /auth/canva/callback ──────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('http://localhost:5173/settings?canva=error');
  }

  try {
    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  env.CANVA_REDIRECT_URI,
      client_id:     env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
      code_verifier: pendingVerifier,
    });

    const response = await axios.post(
      'https://api.canva.com/rest/v1/oauth/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    store.accessToken  = response.data.access_token;
    store.refreshToken = response.data.refresh_token || null;
    store.expiresAt    = Date.now() + (response.data.expires_in || 3600) * 1000;
    pendingVerifier    = null;

    saveStore(store);

    res.redirect('http://localhost:5173/settings?canva=connected');
  } catch (err) {
    console.error('[canva] Token exchange failed:', err.response?.data || err.message);
    res.redirect('http://localhost:5173/settings?canva=error');
  }
});

// ── GET /auth/canva/status ────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  const connected = !!(store.accessToken && store.expiresAt > Date.now());
  res.json({ connected });
});

// ── POST /auth/canva/disconnect ───────────────────────────────────────────────
router.post('/disconnect', (_req, res) => {
  store.accessToken  = null;
  store.refreshToken = null;
  store.expiresAt    = null;
  saveStore(store);
  res.json({ disconnected: true });
});

// ── Token refresh ─────────────────────────────────────────────────────────────
async function refreshAccessToken() {
  if (!store.refreshToken) return null;
  try {
    const params = new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: store.refreshToken,
      client_id:     env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
    });
    const response = await axios.post(
      'https://api.canva.com/rest/v1/oauth/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    store.accessToken  = response.data.access_token;
    store.refreshToken = response.data.refresh_token || store.refreshToken;
    store.expiresAt    = Date.now() + (response.data.expires_in || 3600) * 1000;
    saveStore(store);
    console.log('[canva] Token refreshed successfully');
    return store.accessToken;
  } catch (err) {
    console.error('[canva] Token refresh failed:', err.response?.data || err.message);
    return null;
  }
}

// ── Export token for use in other services ────────────────────────────────────
async function getAccessToken() {
  if (!store.accessToken) return null;
  // Refresh if expired or expiring within 5 minutes
  if (store.expiresAt - Date.now() < 5 * 60 * 1000) {
    return await refreshAccessToken();
  }
  return store.accessToken;
}

module.exports = { router, getAccessToken };