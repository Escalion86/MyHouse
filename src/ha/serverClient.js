export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin', ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Сервер недоступен. Попробуйте ещё раз.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export class ServerClient {
  constructor({onSnapshot, onExpired, onError}) {
    Object.assign(this, {onSnapshot, onExpired, onError, states: {}, ready: false, active: false});
  }
  start() { this.active = true; this.poll(); }
  stop() { this.active = false; clearTimeout(this.timer); }
  async refresh() {
    const snapshot = await api('/snapshot');
    if (this.active) {
      this.states = snapshot.states;
      this.ready = snapshot.status === 'connected';
      this.onSnapshot(snapshot);
    }
    return snapshot;
  }
  async poll() {
    try { await this.refresh(); }
    catch (error) {
      if (!this.active) return;
      this.ready = false;
      this.states = {};
      if (error.status === 401) { this.stop(); this.onExpired(); return; }
      this.onError(error.message);
    }
    if (this.active) this.timer = setTimeout(() => this.poll(), 2000);
  }
  async connect(token) {
    await api('/ha/connect', {method: 'POST', body: JSON.stringify({token})});
    return this.refresh();
  }
  async disconnect() {
    await api('/ha/connection', {method: 'DELETE'});
    return this.refresh();
  }
  async saveMapping(key, entities) {
    await api(`/mappings/${encodeURIComponent(key)}`, {method: 'PUT', body: JSON.stringify({entities})});
    return this.refresh();
  }
  async service(entityId, service, data = {}) {
    return api('/ha/service', {method: 'POST', body: JSON.stringify({entityId, service, data})});
  }
}
