# Como Testar o App (Fase 2)

## 🚀 Iniciar o Projeto

```bash
cd /home/ceanbrjr/Dev/sindoca-native
npx expo start
```

## 📱 Opções de Teste

### 1. Expo Go (Mais Rápido)
- Instalar Expo Go no celular (App Store / Google Play)
- Escanear QR code que aparece no terminal
- App abre instantaneamente

### 2. Emulador Android
```bash
npx expo start --android
```

### 3. Simulador iOS (apenas macOS)
```bash
npx expo start --ios
```

## ✅ O Que Testar

### Navegação (5 tabs)
- [ ] Tab "Início" - Ver cards animados
- [ ] Tab "Galeria" - Placeholder com "Em breve"
- [ ] Tab "Mensagens" - Placeholder com "Em breve"
- [ ] Tab "Música" - Placeholder com "Em breve"
- [ ] Tab "Perfil" - Ver informações do usuário

### Animações
- [ ] FadeIn nos cards (aparecem com fade)
- [ ] ScaleOnPress no card rosa "Pronto para Fase 3"
- [ ] Trocar de tab e ver transições

### Haptic Feedback
- [ ] Pressionar qualquer botão
- [ ] Sentir vibração leve no celular
- [ ] Trocar de tab (vibração de seleção)

### UI Components
- [ ] Ver Cards com sombras
- [ ] Ler textos formatados
- [ ] Ver ícones nas tabs

## 🔧 Se Algo Não Funcionar

### Limpar cache
```bash
npx expo start -c
```

### Reinstalar dependências
```bash
rm -rf node_modules
npm install
```

### Verificar se está na pasta certa
```bash
pwd
# Deve mostrar: /home/ceanbrjr/Dev/sindoca-native
```

## 📝 Features Implementadas

✅ Navegação entre 5 tabs
✅ Animações Moti/Reanimated
✅ Haptic feedback
✅ Componentes UI (Button, Card, etc)
✅ Context de autenticação
✅ Estilos com paleta Sindoca
✅ Push notifications (setup - testar em device)

## ⏭️ Próxima Fase

Fase 3 implementará:
- Câmera e galeria funcionais
- Upload de fotos
- Gravação de áudio
- Push notifications testing
- Spotify OAuth

## 📞 Comandos Úteis

```bash
# Ver logs
npx expo start

# Abrir no Android
a

# Abrir no iOS
i

# Abrir no web (experimental)
w

# Limpar cache
c

# Sair
q
```
