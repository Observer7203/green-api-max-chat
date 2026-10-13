# Green Chat

Чат для MAX на GREEN-API.

## Запуск

Node.js 20.19 или новее.

```bash
git clone https://github.com/Observer7203/green-api-max-chat.git
cd green-api-max-chat
npm install
npm run dev
```

Откройте http://localhost:5173 и введите `idInstance` и `apiTokenInstance` инстанса MAX из
личного кабинета GREEN-API.

Чтобы приходили ответы, у инстанса должны быть включены уведомления о входящих сообщениях. Если
они выключены, чат покажет кнопку «Включить».

## Тесты и сборка

```bash
npm test          # тесты
npm run lint      # линтер
npm run build     # проверка типов и сборка
```

Скриншоты лежат в папке [docs](docs). Фоновый узор взят из веб-клиента MAX.
