# Perfil e Configurações - Documentação

## Visão Geral

Implementação completa do sistema de Perfil e Notificações para o app de casal Sindoca.

## Funcionalidades Implementadas

### 1. Tela de Perfil (`app/(modals)/profile.tsx`)

Permite que os usuários personalizem suas informações:

**Recursos:**
- ✅ Avatar clicável com upload de foto
- ✅ Upload de imagem para Supabase Storage
- ✅ Edição de nome
- ✅ Visualização de email (não editável)
- ✅ Campo de bio/status
- ✅ Salvamento automático no Supabase
- ✅ Feedback visual com haptics

**Fluxo:**
1. Usuário clica no avatar ou no menu "Perfil"
2. Pode fazer upload de foto da galeria
3. Editar nome e bio
4. Salvar alterações

### 2. Tela de Notificações (`app/(modals)/notifications.tsx`)

Configurações de notificações personalizadas para o casal:

**Categorias:**
- ✅ **Geral**: Toggle master para notificações push
- ✅ **Atividades do Mozão**:
  - Novas músicas adicionadas
  - Novas fotos na galeria
  - Novas razões escritas
- ✅ **Lembretes**: Lembrete diário para interagir

**Características:**
- Salvamento instantâneo ao mudar toggle
- Feedback háptico
- Desabilita opções específicas se push estiver desabilitado
- Interface com ícones coloridos por categoria

### 3. Menu Atualizado (`app/(tabs)/menu.tsx`)

**Mudanças no Header:**
- ✅ Avatar clicável para editar perfil
- ✅ Exibe nome do usuário (não email)
- ✅ Removido "Sindoca App"
- ✅ Badge de câmera no avatar
- ✅ Carrega foto do perfil do Supabase

**Menu de Configurações:**
- ✅ Perfil - Ativado e funcional
- ✅ Notificações - Ativado e funcional
- ❌ Configurações - Removido (não necessário)

## Estrutura do Banco de Dados

### Tabela `profiles`

```sql
{
  id: UUID (referência para auth.users),
  name: TEXT,
  avatar_url: TEXT,
  bio: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Tabela `notification_settings`

```sql
{
  id: UUID,
  user_id: UUID (referência para auth.users),
  push_enabled: BOOLEAN,
  music_notifications: BOOLEAN,
  photo_notifications: BOOLEAN,
  reason_notifications: BOOLEAN,
  daily_reminder: BOOLEAN,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Storage Bucket `profiles`

Bucket público para armazenar fotos de perfil dos usuários.

## Como Executar a Migração

### 1. Via Supabase Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New query**
5. Cole o conteúdo de `supabase-migrations.sql`
6. Clique em **Run**

### 2. Via Supabase CLI (se configurado)

```bash
# Execute a migração
supabase db push
```

## Políticas de Segurança (RLS)

### Profiles

- ✅ Usuários podem ver e editar seus próprios perfis
- ✅ Membros do mesmo workspace podem ver perfis uns dos outros
- ✅ Trigger automático cria perfil ao cadastrar novo usuário

### Notification Settings

- ✅ Usuários podem ver e editar apenas suas próprias configurações
- ✅ Configurações padrão criadas automaticamente

### Storage (Profiles)

- ✅ Usuários só podem fazer upload/editar/deletar suas próprias fotos
- ✅ Todos podem visualizar fotos (bucket público)
- ✅ Nomenclatura: `avatars/{user_id}-{timestamp}.{ext}`

## Permissões Necessárias

O app solicita as seguintes permissões:

- **Galeria de Fotos**: Para selecionar foto de perfil
  - iOS: `NSPhotoLibraryUsageDescription`
  - Android: `READ_EXTERNAL_STORAGE`

## Integração com Expo Image Picker

```typescript
import * as ImagePicker from 'expo-image-picker';

// Já configurado em:
// - app/(modals)/profile.tsx
```

## Testes

### Checklist de Teste

- [ ] Upload de foto de perfil funciona
- [ ] Foto aparece no menu após upload
- [ ] Nome do usuário é exibido corretamente
- [ ] Bio é salva corretamente
- [ ] Toggles de notificação salvam no banco
- [ ] Toggles específicos desabilitam quando push_enabled = false
- [ ] Avatar clicável abre tela de perfil
- [ ] Menu Perfil abre tela de edição
- [ ] Menu Notificações abre configurações

## Próximos Passos (Futuras Melhorias)

### Notificações Push

Para implementar as notificações push reais:

1. Configurar Expo Notifications
2. Criar serverless functions para enviar notificações
3. Integrar com eventos do Supabase (triggers)
4. Exemplo:

```typescript
// Quando usuário adiciona música, notificar parceiro
await supabase
  .from('music')
  .on('INSERT', async (payload) => {
    // Buscar parceiro no workspace
    // Verificar configurações de notificação
    // Enviar push notification
  })
  .subscribe();
```

### Profile Enhancements

- [ ] Crop de imagem antes do upload
- [ ] Compressão de imagem
- [ ] Limite de tamanho de arquivo
- [ ] Validação de tipo de arquivo
- [ ] Preview da foto antes de salvar

## Arquivos Criados/Modificados

### Novos Arquivos

- `app/(modals)/profile.tsx` - Tela de edição de perfil
- `app/(modals)/notifications.tsx` - Tela de configurações de notificações
- `supabase-migrations.sql` - Migração do banco de dados
- `docs/PROFILE_AND_SETTINGS.md` - Esta documentação

### Arquivos Modificados

- `app/(tabs)/menu.tsx` - Atualizado header e menu de configurações

## Troubleshooting

### Erro: "Table profiles does not exist"

**Solução**: Execute a migração SQL no Supabase Dashboard

### Erro: "Storage bucket profiles does not exist"

**Solução**: A migração SQL cria o bucket automaticamente. Verifique se a migração foi executada com sucesso.

### Foto não aparece após upload

**Possíveis causas:**
1. Bucket não é público - Verifique no Supabase Storage
2. URL incorreta - Verifique se `getPublicUrl()` retorna URL válida
3. CORS - Verifique configurações de CORS no Supabase

### Notificações não salvam

**Solução**:
1. Verifique se a tabela `notification_settings` existe
2. Verifique RLS policies no Supabase
3. Verifique logs no console

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do console
2. Verifique a documentação do Supabase
3. Verifique as policies de RLS no dashboard

---

**Data de Criação**: 12/11/2025
**Versão**: 1.0.0
**Autor**: Claude Code
