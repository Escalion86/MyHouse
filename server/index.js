import 'dotenv/config';
import { readConfig } from './config.js';
import { openStore } from './store.js';
import { HAService } from './ha.js';
import { createApp } from './app.js';

try {
  const config = readConfig();
  const store = await openStore(config), ha = new HAService(store, config);
  await ha.start();
  const server = createApp({ config, store, ha }).listen(config.port, config.host, () => console.log(`MyHouse: http://${config.host}:${config.port}`));
  let closing = false;
  const close = () => {
    if (closing) return; closing = true; ha.close();
    server.close(async () => { await store.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', close); process.on('SIGTERM', close);
  server.on('error', () => { console.error('Не удалось открыть порт сервера'); close(); });
} catch (error) {
  // Не печатаем URI MongoDB и другие секреты из ошибок драйвера.
  console.error(error.name === 'Error' ? error.message : 'Не удалось запустить сервер. Проверьте MongoDB и конфигурацию.');
  process.exit(1);
}
