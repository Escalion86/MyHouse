import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp, validCommand } from '../server/app.js';
import { hashPassword, verifyPassword, encryptToken, decryptToken } from '../server/security.js';
import { readConfig } from '../server/config.js';
import { devices } from '../src/model/layout.js';

const password = 'test-password-12345';
const env = { NODE_ENV: 'production', APP_ORIGIN: 'https://house.escalion.ru', HA_URL: 'https://home.escalion.ru', MONGODB_URI: 'mongodb://localhost/myhouse', ADMIN_USERNAME: 'owner', ADMIN_PASSWORD_HASH: hashPassword(password), DATA_ENCRYPTION_KEY: 'ab'.repeat(32) };
const config = readConfig(env);
function memoryStore() {
  const sessions = new Map(), mappings = {};
  return { sessions, saveSession: async (id, value) => sessions.set(id, value), getSession: async id => sessions.get(id), deleteSession: async id => sessions.delete(id), getMappings: async () => mappings, setMapping: async (key, value) => { mappings[key] = value; } };
}
async function fixture(t, store = memoryStore(), overrides = {}) {
  const calls = [];
  const ha = { status: 'connected', states: { 'light.test': { state: 'on' } }, configured: true, token: 'secret-never-expose', connect: async token => calls.push(token), disconnect: async () => {}, service: async (...args) => calls.push(args) };
  const server = createApp({ config: { ...config, ...overrides }, store, ha }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, { method = 'GET', body, cookie, origin = config.origin } = {}) => fetch(base + '/api' + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const login = async () => {
    const response = await request('/login', { method: 'POST', body: { username: 'owner', password } });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie');
  };
  return { request, login, store, calls, ha };
}

test('password hashes and authenticated token encryption', () => {
  assert.ok(verifyPassword(password, env.ADMIN_PASSWORD_HASH));
  assert.equal(verifyPassword('wrong', env.ADMIN_PASSWORD_HASH), false);
  const encoded = encryptToken('private-ha-token', env.DATA_ENCRYPTION_KEY);
  assert.equal(decryptToken(encoded, env.DATA_ENCRYPTION_KEY), 'private-ha-token');
  assert.ok(!JSON.stringify(encoded).includes('private-ha-token'));
  assert.throws(() => decryptToken(encoded, 'cd'.repeat(32)));
  assert.throws(() => decryptToken({ ...encoded, tag: '00'.repeat(16) }, env.DATA_ENCRYPTION_KEY));
});

test('production configuration rejects unsafe or incomplete values', () => {
  assert.equal(config.origin, env.APP_ORIGIN);
  for (const changes of [{ APP_ORIGIN: 'http://house.escalion.ru' }, { HA_URL: 'https://home.escalion.ru/path' }, { DATA_ENCRYPTION_KEY: 'short' }, { ADMIN_PASSWORD_HASH: 'password' }, { PORT: 'abc' }, { MONGODB_URI: '' }]) assert.throws(() => readConfig({ ...env, ...changes }));
});

test('API authenticates and protects mutations against cross-origin requests', async t => {
  const { request, login } = await fixture(t);
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/snapshot')).status, 401);
  assert.equal((await request('/login', { method: 'POST', origin: 'https://evil.example', body: { username: 'owner', password } })).status, 403);
  assert.equal((await request('/login', { method: 'POST', body: { username: 'owner', password: 'wrong' } })).status, 401);
  const header = await login(), cookie = header.split(';')[0];
  assert.match(header, /__Host-myhouse_session=/);
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(header.includes(flag));
  const response = await request('/snapshot', { cookie });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const snapshot = await response.json();
  assert.equal(snapshot.tokenConfigured, true);
  assert.ok(!JSON.stringify(snapshot).includes('secret-never-expose'));
  assert.equal((await request('/logout', { method: 'POST', cookie })).status, 200);
  assert.equal((await request('/snapshot', { cookie })).status, 401);
});

test('mappings survive app restart and are shared by separate login sessions', async t => {
  const store = memoryStore(), first = await fixture(t, store);
  const cookie = (await first.login()).split(';')[0];
  const d = devices[0], key = d.channels?.length ? `${d.id}:${d.channels[0].id}` : d.id;
  assert.equal((await first.request('/mappings/' + encodeURIComponent(key), { method: 'PUT', cookie, body: { entities: ['light.test', 'light.test'] } })).status, 200);
  const second = await fixture(t, store), secondCookie = (await second.login()).split(';')[0];
  const result = await (await second.request('/snapshot', { cookie: secondCookie })).json();
  assert.deepEqual(result.mappings[key], ['light.test']);
  assert.equal((await second.request('/snapshot', { cookie })).status, 200);
  store.sessions.forEach(value => { value.expiresAt = new Date(0); });
  assert.equal((await first.request('/snapshot', { cookie })).status, 401);
});

test('password rotation invalidates existing sessions', async t => {
  const first = await fixture(t), cookie = (await first.login()).split(';')[0];
  const second = await fixture(t, first.store, { passwordHash: hashPassword('new-password-12345') });
  assert.equal((await second.request('/snapshot', { cookie })).status, 401);
});

test('validation blocks invalid mappings and services; failures do not leak credentials', async t => {
  const { request, login, calls, ha, store } = await fixture(t), cookie = (await login()).split(';')[0];
  assert.equal((await request('/mappings/unknown', { method: 'PUT', cookie, body: { entities: ['light.test'] } })).status, 400);
  assert.equal((await request('/ha/service', { method: 'POST', cookie, body: { entityId: 'shell_command.bad', service: 'run' } })).status, 400);
  assert.equal((await request('/ha/service', { method: 'POST', cookie, body: { entityId: 'light.test', service: 'turn_on', data: { brightness: 128 } } })).status, 200);
  assert.deepEqual(calls[0], ['light.test', 'turn_on', { brightness: 128 }]);
  ha.connect = async () => { throw Error('private-ha-token'); };
  const fail = await request('/ha/connect', { method: 'POST', cookie, body: { token: 'private-ha-token' } });
  assert.equal(fail.status, 502);
  assert.ok(!(await fail.text()).includes('private-ha-token'));
  store.getMappings = async () => { throw Error('mongodb://user:secret@server'); };
  const unavailable = await request('/snapshot', { cookie });
  assert.equal(unavailable.status, 503);
  assert.ok(!(await unavailable.text()).includes('secret'));
});

test('command data is restricted to supported device actions', () => {
  assert.ok(validCommand({ entityId: 'vacuum.robot', service: 'return_to_base' }));
  assert.ok(validCommand({ entityId: 'light.lamp', service: 'turn_on', data: { rgb_color: [0, 128, 255] } }));
  for (const data of [{ brightness: -1 }, { brightness: 256 }, { rgb_color: [1, 2] }, { entity_id: 'light.other' }, [], null]) assert.equal(validCommand({ entityId: 'light.lamp', service: 'turn_on', data }), false);
});

test('login attempts are rate limited', async t => {
  const { request } = await fixture(t);
  for (let i = 0; i < 10; i++) assert.equal((await request('/login', { method: 'POST', body: {} })).status, 401);
  assert.equal((await request('/login', { method: 'POST', body: {} })).status, 429);
});
