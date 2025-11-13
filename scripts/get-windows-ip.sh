#!/bin/bash
# Script para descobrir o IP do Windows quando rodando no WSL

echo "🔍 Descobrindo IP do Windows para configurar EXPO_PUBLIC_API_URL..."
echo ""

# Método 1: Via ip route (mais confiável no WSL)
WINDOWS_IP=$(ip route | grep default | awk '{print $3}')

if [ ! -z "$WINDOWS_IP" ]; then
    echo "✅ IP do Windows encontrado: $WINDOWS_IP"
    echo ""
    echo "📝 Atualize seu .env.development com:"
    echo "   EXPO_PUBLIC_API_URL=http://$WINDOWS_IP:3000"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   1. Certifique-se que seu backend está rodando na porta 3000"
    echo "   2. O backend deve estar configurado para aceitar conexões de qualquer origem"
    echo "   3. No backend Next.js, configure CORS se necessário"
    echo ""
    echo "🧪 Teste a conexão:"
    echo "   curl http://$WINDOWS_IP:3000/api/spotify/search?q=test"
else
    echo "❌ Não foi possível descobrir o IP do Windows"
    echo ""
    echo "💡 Alternativas:"
    echo "   1. No Windows, abra PowerShell e rode: ipconfig"
    echo "   2. Procure por 'IPv4 Address' da sua rede Wi-Fi/Ethernet"
    echo "   3. Use esse IP no .env.development"
fi
