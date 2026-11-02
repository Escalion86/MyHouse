import React, {useEffect, useState} from 'react';
import App from './App.jsx';
import {api} from './ha/serverClient.js';

export default function SessionApp() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true); setError('');
    try { setSnapshot(await api('/snapshot')); }
    catch (e) { if (e.status !== 401) setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const login = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('/login', {method: 'POST', body: JSON.stringify({username, password})});
      setPassword(''); setSnapshot(await api('/snapshot'));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    try { await api('/logout', {method: 'POST'}); setSnapshot(null); }
    catch (e) { if (e.status === 401) setSnapshot(null); else alert(e.message); }
  };
  if (snapshot) return <App initialSnapshot={snapshot} onLogout={logout} onExpired={() => setSnapshot(null)}/>;
  return <main className="login-page"><section className="login-card">
    <h1>Мой дом</h1><p>Войдите, чтобы открыть дом и сохранённые настройки устройств.</p>
    {loading ? <p role="status">Подключение к серверу…</p> : <form onSubmit={login}>
      <label>Имя пользователя<input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)}/></label>
      <label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="login-error">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? 'Вход…' : 'Войти'}</button>
      {error && <button type="button" className="button" onClick={load}>Повторить подключение</button>}
    </form>}
  </section></main>;
}
