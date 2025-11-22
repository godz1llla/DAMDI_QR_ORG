# 🚀 Как запустить проект (ПРОСТАЯ ИНСТРУКЦИЯ)

## 1. Запустить MySQL (один раз)

```bash
cd /home/hubtech/Documents/DAMDIQRRR
sudo ./setup-mysql-simple.sh
```

Если MySQL уже запущен, можно пропустить этот шаг.

---

## 2. Запустить Backend (терминал 1)

```bash
cd /home/hubtech/Documents/DAMDIQRRR/nodejs
npm run dev
```

Оставить этот терминал открытым!

---

## 3. Запустить Frontend (терминал 2)

```bash
cd /home/hubtech/Documents/DAMDIQRRR/react-app
npm run dev
```

Оставить этот терминал открытым!

---

## 4. Открыть браузер

**http://localhost:5173**

---

## Войти

**Email:** `admin@demo.com`  
**Пароль:** `admin123`

---

## ⚠️ Если не работает

### Ошибка: "address already in use"
```bash
# Остановить процесс на порту 3000
lsof -ti:3000 | xargs kill -9

# Остановить процесс на порту 5173
lsof -ti:5173 | xargs kill -9
```

### Ошибка: "MySQL не подключен"
```bash
cd /home/hubtech/Documents/DAMDIQRRR
sudo ./setup-mysql-simple.sh
```

### Ошибка: "npm run dev не работает"
```bash
# В папке nodejs или react-app
npm install
```

---

## 🛑 Остановить проект

В каждом терминале нажать `Ctrl+C`

Остановить MySQL:
```bash
sudo docker stop damdiqr_mysql
```
