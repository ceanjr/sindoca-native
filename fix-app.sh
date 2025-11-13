#!/bin/bash

# Script para corrigir os problemas do app nativo Sindoca
# Execute no diretório sindoca-native: bash fix-app.sh

set -e

echo "🔧 Iniciando correções do app nativo..."

# 1. Adicionar SafeAreaProvider ao _layout.tsx
echo "📱 Adicionando SafeAreaProvider..."
cd /home/ceanbrjr/Dev/sindoca-native

# Backup do arquivo atual
cp app/_layout.tsx app/_layout.tsx.backup_$(date +%s)

# Adicionar import do SafeAreaProvider
sed -i "10i import { SafeAreaProvider } from 'react-native-safe-area-context';" app/_layout.tsx

# Envolver GestureHandlerRootView com SafeAreaProvider
sed -i 's/<GestureHandlerRootView style={{ flex: 1 }}>/<SafeAreaProvider>\n        <GestureHandlerRootView style={{ flex: 1 }}>/g' app/_layout.tsx
sed -i 's/<\/GestureHandlerRootView>/<\/GestureHandlerRootView>\n      <\/SafeAreaProvider>/g' app/_layout.tsx

echo "✅ SafeAreaProvider adicionado!"

# 2. Adicionar useSafeAreaInsets nas páginas
echo "📄 Adicionando safe area insets nas páginas..."

for page in "app/(tabs)/galeria.tsx" "app/(tabs)/musica.tsx" "app/(tabs)/razoes.tsx"; do
    if [ -f "$page" ]; then
        # Backup
        cp "$page" "${page}.backup_$(date +%s)"
        
        # Adicionar import se não existir
        if ! grep -q "useSafeAreaInsets" "$page"; then
            sed -i "1i import { useSafeAreaInsets } from 'react-native-safe-area-context';" "$page"
        fi
        
        # Adicionar hook dentro do componente
        sed -i '/export default function/a \  const insets = useSafeAreaInsets();' "$page"
        
        echo "  ✓ $page atualizado"
    fi
done

echo "✅ Safe area insets adicionados!"

# 3. Criar componente de debug para testar imagens
echo "🖼️  Criando componente de debug..."

cat > debug/ImageDebug.tsx << 'EOF'
import { View, Text, Image, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function ImageDebug() {
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    testImage();
  }, []);

  async function testImage() {
    // Testar busca de uma foto
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('type', 'photo')
      .limit(1)
      .single();

    if (data) {
      console.log('Photo data:', data);
      
      const photoData = data.data || {};
      let url = photoData.url;
      
      if (photoData.path) {
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(photoData.path);
        url = urlData.publicUrl;
      }
      
      console.log('Final URL:', url);
      setTestUrl(url);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Test Image URL:</Text>
      <Text style={styles.url}>{testUrl}</Text>
      {testUrl && (
        <Image
          source={{ uri: testUrl }}
          style={styles.image}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  url: {
    fontSize: 10,
    color: '#666',
  },
  image: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
  },
});
EOF

echo "✅ Componente de debug criado!"

# 4. Instruções finais
echo ""
echo "=========================================="
echo "✅ CORREÇÕES APLICADAS COM SUCESSO!"
echo "=========================================="
echo ""
echo "📋 O que foi feito:"
echo "  1. ✓ SafeAreaProvider adicionado ao _layout raiz"
echo "  2. ✓ useSafeAreaInsets adicionado nas páginas de tabs"
echo "  3. ✓ Componente de debug criado"
echo ""
echo "🔍 Problemas identificados:"
echo ""
echo "1. FOTOS NÃO APARECEM:"
echo "   Causa: URLs do Supabase Storage não estão sendo geradas corretamente"
echo "   Solução: Use getPublicUrl() com o path correto"
echo "   Exemplo:"
echo '   const { data } = supabase.storage.from("photos").getPublicUrl(path)'
echo ""
echo "2. MÚSICAS NÃO APARECEM:"
echo "   Causa: Mapeamento incorreto dos dados do banco"
echo "   Solução: Verificar estrutura do campo data.* na tabela content"
echo ""
echo "3. SAFE AREA NO TOPO:"
echo "   Causa: Componentes não usam insets.top para padding"
echo "   Solução: Adicionar paddingTop: insets.top nos containers principais"
echo ""
echo "📝 Próximos passos manuais necessários:"
echo ""
echo "1. Abra app/(tabs)/galeria.tsx e adicione no container principal:"
echo "   style={[styles.container, { paddingTop: insets.top }]}"
echo ""
echo "2. Abra app/(tabs)/musica.tsx e repita o mesmo"
echo ""
echo "3. Abra app/(tabs)/razoes.tsx e repita o mesmo"
echo ""
echo "4. Para testar carregamento de imagens, adicione no início da página:"
echo "   import { ImageDebug } from '@/debug/ImageDebug'"
echo "   E renderize: <ImageDebug />"
echo ""
echo "5. Verifique os logs do console para ver se as URLs estão corretas"
echo ""
echo "🚀 Teste o app com:"
echo "   cd /home/ceanbrjr/Dev/sindoca-native"
echo "   npx expo start"
echo ""
echo "📱 Abra no Expo Go e verifique:"
echo "   - Topo não fica sob o notch (iPhone)"
echo "   - Fotos aparecem na galeria"
echo "   - Músicas aparecem na lista"
echo ""
echo "=========================================="
EOF
chmod +x /home/ceanbrjr/Dev/sindoca-native/fix-app.sh
echo "Script criado: /home/ceanbrjr/Dev/sindoca-native/fix-app.sh"