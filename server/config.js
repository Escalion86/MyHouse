export function readConfig(env = process.env) {
  const required = name => { if (!env[name]?.trim()) throw new Error(`Не задана переменная ${name}`); return env[name].trim(); };
  const production = env.NODE_ENV === 'production';
  const origin = new URL(required('APP_ORIGIN'));
  const ha = new URL(required('HA_URL'));
  if (![origin, ha].every(url => ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password)) throw new Error('APP_ORIGIN и HA_URL должны быть адресами HTTP(S)');
  if (production && (origin.protocol !== 'https:' || ha.protocol !== 'https:')) throw new Error('В production требуются HTTPS адреса APP_ORIGIN и HA_URL');
  if (origin.href !== origin.origin + '/' || ha.href !== ha.origin + '/') throw new Error('Укажите APP_ORIGIN и HA_URL без путей и параметров');
  const passwordHash = required('ADMIN_PASSWORD_HASH');
  if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)) throw new Error('Создайте ADMIN_PASSWORD_HASH через npm run password:hash');
  const encryptionKey = required('DATA_ENCRYPTION_KEY');
  if (!/^[a-f0-9]{64}$/i.test(encryptionKey)) throw new Error('DATA_ENCRYPTION_KEY должен содержать 64 hex-символа');
  const port = Number(env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Некорректный PORT');
  return { production, origin: origin.origin, haUrl: ha.origin, passwordHash, encryptionKey,
    username: required('ADMIN_USERNAME'), mongoUri: required('MONGODB_URI'), mongoDb: env.MONGODB_DB || 'myhouse',
    host: env.HOST || '127.0.0.1', port, sessionMs: 7 * 86400000 };
}
