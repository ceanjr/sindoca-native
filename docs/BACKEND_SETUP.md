# 🔧 Configuração do Backend para o App Nativo

## 📱 Por que preciso configurar o backend?

O React Native **NÃO pode usar `localhost` ou `127.0.0.1`** porque:
- Essas URLs apontam para o próprio dispositivo/emulador
- O app precisa acessar o backend através da **rede local**
- Você precisa usar o **IP real** do computador onde o backend está rodando

---

## 🖥️ Descobrindo o IP Correto

### **Opção 1: Script Automático (WSL)**

```bash
# No terminal WSL, rode:
./scripts/get-windows-ip.sh
```

### **Opção 2: Manual (WSL)**

```bash
# No terminal WSL, rode:
ip route | grep default | awk '{print $3}'
```

### **Opção 3: Windows PowerShell**

```powershell
# No Windows, rode:
ipconfig

# Procure por:
# - "Adaptador de Rede sem Fio Wi-Fi" ou "Ethernet"
# - IPv4 Address: 192.168.1.XXX
```

### **Opção 4: macOS/Linux**

```bash
# No terminal, rode:
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## ⚙️ Configuração de Desenvolvimento

### 1. **Copie o arquivo de ambiente**

```bash
cp .env.example .env.development
```

### 2. **Edite `.env.development`**

```bash
# Substitua 192.168.1.100 pelo SEU IP descoberto acima
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### 3. **Configure o Backend (Next.js/Sindoca Web)**

No seu backend web, certifique-se que está configurado para aceitar conexões externas:

**`next.config.js`** (se necessário):
```javascript
module.exports = {
  // ... outras configs
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Em dev apenas!
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};
```

### 4. **Inicie o Backend**

```bash
# No diretório do backend (sindoca web)
npm run dev

# Certifique-se que está rodando em: http://0.0.0.0:3000
# (não apenas localhost:3000)
```

### 5. **Teste a Conexão**

```bash
# No WSL ou terminal, teste:
curl http://SEU_IP:3000/api/spotify/search?q=test

# Se funcionar, você receberá uma resposta JSON
# Se não funcionar, verifique:
# - Firewall do Windows
# - Backend está rodando
# - IP está correto
```

---

## 🚀 Configuração de Produção

### **Opção 1: Variáveis de Ambiente do EAS Build**

```bash
# Configure secrets no EAS:
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://seu-backend.vercel.app
```

### **Opção 2: Arquivo `.env.production`**

```bash
# Edite .env.production
EXPO_PUBLIC_API_URL=https://seu-backend-production.com
```

### **Opção 3: `app.config.js` dinâmico**

Já configurado! O app automaticamente usa:
- `.env.development` para `expo start`
- `.env.production` para `eas build`

---

## 🔥 Troubleshooting

### ❌ "Network request failed"

**Problema**: App não consegue conectar ao backend

**Soluções**:
1. ✅ Verifique se o backend está rodando
2. ✅ Teste a URL no navegador do seu celular: `http://SEU_IP:3000`
3. ✅ Verifique o firewall do Windows:
   ```powershell
   # Windows PowerShell (Admin)
   New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```
4. ✅ Certifique-se que está na mesma rede Wi-Fi
5. ✅ Reinicie o Expo: `npx expo start --clear`

### ❌ "CORS error"

**Problema**: Backend bloqueando requisições do app

**Solução**: Configure CORS no backend (veja seção 3 acima)

### ❌ "Connection refused"

**Problema**: Backend não está acessível na rede

**Solução**: Inicie o backend com:
```bash
# Ao invés de: npm run dev
# Use:
npm run dev -- -H 0.0.0.0
```

---

## 📝 Scripts Úteis

```bash
# Descobrir IP
npm run get-ip

# Iniciar em desenvolvimento
npm start

# Iniciar com cache limpo
npm run start:clean

# Build para produção
eas build --platform android --profile production
```

---

## 🎯 Checklist Rápido

- [ ] IP do Windows descoberto
- [ ] `.env.development` configurado com IP correto
- [ ] Backend rodando em `http://0.0.0.0:3000`
- [ ] Firewall permite conexões na porta 3000
- [ ] Celular/emulador na mesma rede Wi-Fi
- [ ] Teste manual da URL funcionando: `http://SEU_IP:3000`
- [ ] CORS configurado no backend (se necessário)
- [ ] App reiniciado com cache limpo

Se tudo acima está ✅, o app deve conectar com sucesso! 🎉
