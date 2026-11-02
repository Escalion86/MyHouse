import { HomeAssistantClient } from '../src/ha/client.js';
import { decryptToken, encryptToken } from './security.js';

export class HAService {
  constructor(store, config, Client = HomeAssistantClient) {
    this.store = store; this.config = config; this.token = ''; this.status = 'disconnected'; this.connecting = false; this.closed = false;
    this.client = new Client({ onStatus: status => { this.status = status; if (status === 'disconnected') this.scheduleReconnect(); } });
  }
  get states() { return this.client.states; }
  get configured() { return Boolean(this.token); }
  scheduleReconnect() {
    clearTimeout(this.timer);
    if (!this.token || this.closed || this.connecting) return;
    this.timer = setTimeout(() => this.connect().catch(() => {}), 15000);
    this.timer.unref?.();
  }
  async start() {
    const saved = await this.store.getToken();
    if (saved) this.token = decryptToken(saved, this.config.encryptionKey);
    if (this.token) this.connect().catch(() => {});
  }
  async connect(token) {
    if (this.connecting) throw new Error('Подключение уже выполняется');
    if (!token && !this.token) throw new Error('Введите токен Home Assistant');
    this.connecting = true; clearTimeout(this.timer);
    try {
      const candidate = token || this.token;
      await this.client.connect(this.config.haUrl, candidate);
      if (token) {
        await this.store.setToken(encryptToken(token, this.config.encryptionKey));
        this.token = token;
      }
    } catch (error) {
      this.client.disconnect();
      throw error;
    } finally {
      this.connecting = false;
      if (this.status !== 'connected') this.scheduleReconnect();
    }
  }
  async disconnect() {
    if (this.connecting) throw new Error('Дождитесь завершения подключения');
    await this.store.setToken(null);
    this.token = ''; clearTimeout(this.timer); this.client.disconnect();
  }
  service(...args) { return this.client.service(...args); }
  close() { this.closed = true; clearTimeout(this.timer); this.client.disconnect(); }
}
