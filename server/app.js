import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices } from '../src/model/layout.js';
import { verifyPassword, sessionHash, newSession } from './security.js';

const mappingKeys = new Set(devices.flatMap(device => device.channels?.length ? device.channels.map(channel => `${device.id}:${channel.id}`) : [device.id]));
const entityPattern = /^[a-z0-9_]+\.[a-z0-9_]+$/;
const services = { light: ['turn_on', 'turn_off'], switch: ['turn_on', 'turn_off'], media_player: ['turn_on', 'turn_off', 'media_play_pause'], vacuum: ['start', 'pause', 'stop', 'return_to_base'] };
export function validCommand({ entityId, service, data = {} }) {
  if (typeof entityId !== 'string' || !entityPattern.test(entityId) || !services[entityId.split('.')[0]]?.includes(service)) return false;
  if (!data || Array.isArray(data) || typeof data !== 'object') return false;
  return Object.entries(data).every(([key, value]) => {
    if (!entityId.startsWith('light.') || service !== 'turn_on') return false;
    if (key === 'brightness') return Number.isInteger(value) && value >= 0 && value <= 255;
    return key === 'rgb_color' && Array.isArray(value) && value.length === 3 && value.every(v => Number.isInteger(v) && v >= 0 && v <= 255);
  });
}

export function createApp({ config, store, ha, dist = fileURLToPath(new URL('../dist/', import.meta.url)) }) {
  const app = express(), attempts = new Map();
  const cookieName = config.production ? '__Host-myhouse_session' : 'myhouse_session';
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/' };
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' });
    if (config.production) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== config.origin) return res.status(403).json({ error: 'Недопустимый источник запроса' });
    next();
  });
  app.use('/api', express.json({ limit: '24kb' }));
  const sessionId = req => {
    const value = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? sessionHash(value) : null;
  };
  const authorized = async (req, res, next) => {
    const id = sessionId(req), session = id && await store.getSession(id);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now() || session.credentials !== sessionHash(config.username + config.passwordHash)) return res.status(401).json({ error: 'Войдите в аккаунт владельца' });
    req.sessionId = id; next();
  };
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.post('/api/login', async (req, res) => {
    const now = Date.now();
    for (const [ip, attempt] of attempts) if (attempt.until < now) attempts.delete(ip);
    const attempt = attempts.get(req.ip) || { count: 0, until: now + 15 * 60000 };
    if (attempt.count >= 10) return res.status(429).json({ error: 'Слишком много попыток. Повторите через 15 минут.' });
    attempt.count++; attempts.set(req.ip, attempt);
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || password.length > 512 || !verifyPassword(password, config.passwordHash) || username !== config.username) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const old = sessionId(req); if (old) await store.deleteSession(old);
    const value = newSession();
    await store.saveSession(sessionHash(value), { expiresAt: new Date(now + config.sessionMs), credentials: sessionHash(config.username + config.passwordHash) });
    attempts.delete(req.ip);
    res.cookie(cookieName, value, { ...cookieOptions, maxAge: config.sessionMs });
    res.json({ ok: true });
  });
  app.use('/api', authorized);
  app.post('/api/logout', async (req, res) => {
    await store.deleteSession(req.sessionId); res.clearCookie(cookieName, cookieOptions); res.json({ ok: true });
  });
  app.get('/api/snapshot', async (req, res) => res.json({ status: ha.status, states: ha.states, mappings: await store.getMappings(), haUrl: config.haUrl, tokenConfigured: ha.configured }));
  app.put('/api/mappings/:key', async (req, res) => {
    const { entities } = req.body || {};
    if (!mappingKeys.has(req.params.key) || !Array.isArray(entities) || entities.length > 8 || !entities.every(id => typeof id === 'string' && entityPattern.test(id))) return res.status(400).json({ error: 'Некорректная привязка устройства' });
    await store.setMapping(req.params.key, [...new Set(entities)]); res.json({ ok: true });
  });
  app.post('/api/ha/connect', async (req, res) => {
    const { token } = req.body || {};
    if (token !== undefined && (typeof token !== 'string' || token.length > 8192)) return res.status(400).json({ error: 'Некорректный токен' });
    try { await ha.connect(token?.trim()); res.json({ ok: true }); }
    catch { res.status(502).json({ error: 'Не удалось подключиться или сохранить токен. Проверьте токен, доступ VPS к Home Assistant и MongoDB.' }); }
  });
  app.delete('/api/ha/connection', async (req, res) => { await ha.disconnect(); res.json({ ok: true }); });
  app.post('/api/ha/service', async (req, res) => {
    if (!validCommand(req.body || {})) return res.status(400).json({ error: 'Недопустимая команда' });
    const { entityId, service, data } = req.body;
    try { await ha.service(entityId, service, data); res.json({ ok: true }); }
    catch { res.status(502).json({ error: 'Home Assistant не выполнил команду. Проверьте состояние устройства и подключение.' }); }
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'API не найден' }));
  app.use(express.static(dist, { index: false }));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503;
    res.status(status).json({ error: status === 503 ? 'Сервер временно недоступен. Повторите попытку.' : 'Некорректный запрос' });
  });
  return app;
}
