#!/bin/bash
# Script de Verificação das Correções - Sindoca Native

echo "======================================"
echo "Verificação das Correções - Sindoca Native"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if files exist
echo "1. Verificando arquivos modificados..."
files_to_check=(
    "app/(tabs)/razoes.tsx"
    "app/(tabs)/musica.tsx"
    "docs/PUSH_NOTIFICATIONS_CHECKLIST.md"
    "docs/FIXES_SUMMARY.md"
    "supabase-migrations-push.sql"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file - ARQUIVO NÃO ENCONTRADO"
    fi
done

echo ""
echo "2. Verificando correções no código..."

# Check razoes.tsx
echo ""
echo "  Verificando app/(tabs)/razoes.tsx:"
if grep -q "menuOverlay: {" "app/(tabs)/razoes.tsx"; then
    echo -e "    ${GREEN}✓${NC} menuOverlay style existe"
else
    echo -e "    ${RED}✗${NC} menuOverlay style não encontrado"
fi

if grep -q "zIndex: 1000," "app/(tabs)/razoes.tsx" | head -1; then
    echo -e "    ${GREEN}✓${NC} menuOverlay com zIndex correto (1000)"
else
    echo -e "    ${YELLOW}⚠${NC} Verificar zIndex do menuOverlay"
fi

if grep -q "zIndex: 1002," "app/(tabs)/razoes.tsx"; then
    echo -e "    ${GREEN}✓${NC} dropdownMenu com zIndex correto (1002)"
else
    echo -e "    ${YELLOW}⚠${NC} Verificar zIndex do dropdownMenu"
fi

if grep -q "overflow: 'visible'," "app/(tabs)/razoes.tsx"; then
    echo -e "    ${GREEN}✓${NC} reasonCard com overflow: visible"
else
    echo -e "    ${RED}✗${NC} overflow: visible não encontrado no reasonCard"
fi

# Check musica.tsx
echo ""
echo "  Verificando app/(tabs)/musica.tsx:"
if grep -q "screenOverlay: {" "app/(tabs)/musica.tsx"; then
    echo -e "    ${GREEN}✓${NC} screenOverlay style existe"
else
    echo -e "    ${RED}✗${NC} screenOverlay style não encontrado"
fi

if grep -q "style={styles.screenOverlay}" "app/(tabs)/musica.tsx"; then
    echo -e "    ${GREEN}✓${NC} screenOverlay renderizado no componente"
else
    echo -e "    ${RED}✗${NC} screenOverlay não está sendo renderizado"
fi

if grep -q "elevation: 10," "app/(tabs)/musica.tsx"; then
    echo -e "    ${GREEN}✓${NC} dropdownMenu com elevation aumentado (10)"
else
    echo -e "    ${YELLOW}⚠${NC} Verificar elevation do dropdownMenu"
fi

if grep -q "overflow: 'visible'" "app/(tabs)/musica.tsx"; then
    echo -e "    ${GREEN}✓${NC} Card wrapper com overflow: visible"
else
    echo -e "    ${RED}✗${NC} overflow: visible não encontrado no card wrapper"
fi

echo ""
echo "3. Verificando documentação..."
if [ -f "docs/PUSH_NOTIFICATIONS_CHECKLIST.md" ]; then
    lines=$(wc -l < "docs/PUSH_NOTIFICATIONS_CHECKLIST.md")
    echo -e "  ${GREEN}✓${NC} PUSH_NOTIFICATIONS_CHECKLIST.md criado ($lines linhas)"
else
    echo -e "  ${RED}✗${NC} PUSH_NOTIFICATIONS_CHECKLIST.md não encontrado"
fi

if [ -f "docs/FIXES_SUMMARY.md" ]; then
    lines=$(wc -l < "docs/FIXES_SUMMARY.md")
    echo -e "  ${GREEN}✓${NC} FIXES_SUMMARY.md criado ($lines linhas)"
else
    echo -e "  ${RED}✗${NC} FIXES_SUMMARY.md não encontrado"
fi

echo ""
echo "4. Verificando migration de push notifications..."
if [ -f "supabase-migrations-push.sql" ]; then
    if grep -q "push_subscriptions_native" "supabase-migrations-push.sql"; then
        echo -e "  ${GREEN}✓${NC} Migration contém tabela push_subscriptions_native"
    else
        echo -e "  ${RED}✗${NC} Tabela push_subscriptions_native não encontrada na migration"
    fi
    
    if grep -q "ENABLE ROW LEVEL SECURITY" "supabase-migrations-push.sql"; then
        echo -e "  ${GREEN}✓${NC} RLS policies configuradas"
    else
        echo -e "  ${YELLOW}⚠${NC} RLS policies podem estar faltando"
    fi
else
    echo -e "  ${RED}✗${NC} supabase-migrations-push.sql não encontrado"
fi

echo ""
echo "======================================"
echo "Verificação Concluída!"
echo "======================================"
echo ""
echo "Próximos passos:"
echo "1. Teste os menus em ambas as telas (Razões e Música)"
echo "2. Execute a migration: supabase-migrations-push.sql"
echo "3. Configure os endpoints de API no Vercel"
echo "4. Teste push notifications em dispositivo físico"
echo ""
