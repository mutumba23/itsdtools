# ITSD Tools

**ITSD Tools** is a desktop application built with **Electron** and **Vue.js**, designed to streamline daily IT support and administration tasks. The tool provides quick access to actions such as managing users, distribution lists, and mailboxes, especially useful in a multi-tenant Microsoft 365/Exchange environment.

> ⚙️ Originally built to support internal IT operations at IKEA.
---
## ✨ Features

- 🔒 Azure/Microsoft authentication
- 📊 View and log usage statistics (via Firebase)
- 📋 Manage mailboxes, users, and distribution lists
- 🔁 Run PowerShell scripts securely from the app
- 🖥️ Cross-platform: Windows, macOS, Linux

---
## 🚀 Tech Stack

- [Electron](https://www.electronjs.org/)
- [Vue 3 (Composition API)](https://vuejs.org/)
- [Firebase](https://firebase.google.com/) (Authentication + Firestore)
- [PowerShell](https://learn.microsoft.com/en-us/powershell/)
---

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
- Extensions: ESLint + Prettier + Volar

### Project Setup

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
