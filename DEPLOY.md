# Запуск MyHouse на VPS без Docker

Приложение состоит из React-сборки и Node.js-сервера. Сервер раздаёт сайт, хранит настройки в MongoDB и подключается к Home Assistant. Для этой версии нужен VPS: GitHub Pages не исполняет серверную часть.

## 1. Подготовка

Нужны Node.js 22.12+ (рекомендуется 24 LTS), MongoDB, nginx и HTTPS-сертификат для `house.escalion.ru`. DNS домена должен указывать на VPS. С VPS должен быть доступен `https://home.escalion.ru`, включая `/api/websocket`.

В каталоге проекта:

```sh
npm ci
cp .env.example .env
npm run password:hash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Первая команда генерации запрашивает пароль владельца (не менее 12 символов) и выводит строку `ADMIN_PASSWORD_HASH=...`. Вторая выводит ключ шифрования для `DATA_ENCRYPTION_KEY`.

## 2. Содержимое .env

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3001
APP_ORIGIN=https://house.escalion.ru
HA_URL=https://home.escalion.ru
MONGODB_URI=mongodb://myhouse:YOUR_PASSWORD@127.0.0.1:27017/myhouse?authSource=myhouse
MONGODB_DB=myhouse
ADMIN_USERNAME=owner
ADMIN_PASSWORD_HASH=scrypt:YOUR_GENERATED_SALT:YOUR_GENERATED_HASH
DATA_ENCRYPTION_KEY=YOUR_GENERATED_64_HEX_CHARACTERS
```

Замените логин/пароль MongoDB, хеш пароля и ключ шифрования реальными значениями. `authSource` — база, в которой создан пользователь MongoDB; если он создан в `admin`, укажите `authSource=admin`. Пользователю нужны права `readWrite` на базу `myhouse`. Спецсимволы в логине/пароле URI нужно кодировать через URL encoding. Можно использовать уже имеющийся URI подключения вашего MongoDB.

`APP_ORIGIN` — точный адрес сайта без пути; `HA_URL` — адрес Home Assistant. Не добавляйте секреты в переменные с префиксом `VITE_`: такие значения попадают в клиентскую сборку. Токен Home Assistant в `.env` не нужен: он вводится в интерфейсе после входа и сохраняется в MongoDB зашифрованным.

Сохраните `DATA_ENCRYPTION_KEY` отдельно вместе с резервной копией базы и не меняйте при обновлениях. Без прежнего ключа сохранённый токен нельзя расшифровать. Ограничьте доступ к `.env` пользователем сервиса (`chmod 600 .env`).

## 3. Сборка и запуск

```sh
npm run build
npm start
```

Проверка сервера: `curl http://127.0.0.1:3001/api/health`. Ожидается `{"ok":true}`. Сервер запускается только после успешного подключения к MongoDB. В production браузер должен открывать сайт через HTTPS nginx, поскольку cookie входа защищена флагом Secure.

Для постоянной работы можно создать `/etc/systemd/system/myhouse.service` (замените каталог и пользователя на свои):

```ini
[Unit]
Description=MyHouse
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=myhouse
WorkingDirectory=/opt/myhouse
EnvironmentFile=/opt/myhouse/.env
ExecStart=/usr/bin/node /opt/myhouse/server/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Убедитесь, что `/usr/bin/node` — путь к установленному Node.js, а пользователь `myhouse` существует и читает проект и `.env`.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now myhouse
sudo journalctl -u myhouse -n 50
```

## 4. nginx

Пример для уже выпущенного сертификата (пути могут отличаться):

```nginx
server {
    listen 80;
    server_name house.escalion.ru;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name house.escalion.ru;
    ssl_certificate /etc/letsencrypt/live/house.escalion.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/house.escalion.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Выполните `sudo nginx -t`, затем `sudo systemctl reload nginx`. Порт Node.js остаётся на loopback; наружу нужен только nginx. Браузер общается с API своего сайта, поэтому добавлять домен сайта в CORS Home Assistant не требуется. WebSocket к HA открывает сам Node.js-сервер.

## 5. Первое подключение

Откройте `https://house.escalion.ru`, войдите с `ADMIN_USERNAME` и паролем, для которого создан хеш. В настройках подключения введите долгосрочный токен Home Assistant и привяжите устройства к сущностям.

После входа с другого телефона/компьютера загрузятся те же привязки. Токен не передаётся обратно в браузер. Сервер восстанавливает подключение после перезапуска и повторяет попытки при потере связи. Привязки сохраняются отдельно для каждого устройства/канала, поэтому обновление одного не перезаписывает другие.

Сессия входа действует 7 дней; после истечения нужно войти снова, настройки останутся. Выход завершает сессию текущего браузера. Изменение логина или хеша пароля в `.env` с перезапуском завершит все прежние сессии. Кнопка «Отключить и удалить токен» удаляет именно подключение HA, сохраняя привязки.

В MongoDB сохраняются привязки, зашифрованный токен и сессии. Положение камеры, открытые двери и текущая выбранная комната — временное состояние интерфейса. Старые настройки из localStorage предыдущей версии автоматически не импортируются: привяжите устройства один раз в новой версии.

## Обновление и локальная разработка

При обновлении сохраните `.env`, выполните `npm ci`, `npm run build`, затем `sudo systemctl restart myhouse`. Данные остаются в MongoDB.

Для локальной работы укажите в `.env` `NODE_ENV=development` и `APP_ORIGIN=http://localhost:5173`, оставив рабочее подключение к MongoDB. В двух терминалах запустите `npm run server:dev` и `npm run dev`. Vite проксирует `/api` на порт 3001. Если меняете порт Node.js, измените и proxy в `vite.config.js`.

Проверки: `npm test`, `npm run build`. Автоматические серверные тесты используют тестовое хранилище и имитацию HA; реальное подключение проверяется после заполнения `.env` на вашем сервере.
