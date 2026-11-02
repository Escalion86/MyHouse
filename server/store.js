import { MongoClient } from 'mongodb';

export async function openStore(config) {
  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(config.mongoDb);
  const sessions = db.collection('sessions'), settings = db.collection('settings'), mappings = db.collection('mappings');
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return {
    async saveSession(id, value) { await sessions.insertOne({ _id: id, ...value }); },
    async getSession(id) { return sessions.findOne({ _id: id }); },
    async deleteSession(id) { await sessions.deleteOne({ _id: id }); },
    async getToken() { return (await settings.findOne({ _id: 'ha' }))?.token || null; },
    async setToken(token) { await settings.updateOne({ _id: 'ha' }, { $set: { token } }, { upsert: true }); },
    async getMappings() { return Object.fromEntries((await mappings.find().toArray()).map(row => [row._id, row.entities])); },
    async setMapping(key, entities) { await mappings.updateOne({ _id: key }, { $set: { entities } }, { upsert: true }); },
    close: () => client.close()
  };
}
