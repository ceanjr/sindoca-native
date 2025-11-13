# Configuração do Supabase Storage

## Problema: "new row violates row-level security policy"

Esse erro acontece quando as policies de storage estão bloqueando uploads. Siga os passos abaixo para corrigir.

## Solução Rápida (via Interface)

### 1. Acessar Storage no Supabase Dashboard

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **Storage** no menu lateral

### 2. Configurar o Bucket "photos"

#### Criar o bucket (se não existir):
1. Clique em "New bucket"
2. Nome: `photos`
3. Marque "Public bucket" ✅
4. Clique em "Create bucket"

#### Configurar Policies:
1. Clique no bucket `photos`
2. Vá para a aba **Policies**
3. Clique em "New Policy"

**Policy 1: Upload de Fotos**
- Name: `Users can upload photos`
- Policy Command: `INSERT`
- Policy Definition:
```sql
bucket_id = 'photos' AND auth.uid() IS NOT NULL
```

**Policy 2: Leitura de Fotos**
- Name: `Anyone can view photos`
- Policy Command: `SELECT`
- Policy Definition:
```sql
bucket_id = 'photos'
```

**Policy 3: Delete de Fotos (Opcional)**
- Name: `Users can delete their photos`
- Policy Command: `DELETE`
- Policy Definition:
```sql
bucket_id = 'photos' AND auth.uid() IS NOT NULL
```

### 3. Configurar o Bucket "profiles"

Repita o mesmo processo para o bucket `profiles`:

1. Criar bucket `profiles` (se não existir) - Marcar como público
2. Adicionar policies:

**Policy 1: Upload**
```sql
bucket_id = 'profiles' AND auth.uid() IS NOT NULL
```

**Policy 2: Leitura**
```sql
bucket_id = 'profiles'
```

**Policy 3: Delete**
```sql
bucket_id = 'profiles' AND auth.uid() IS NOT NULL
```

### 4. Configurar o Bucket "audio" (se necessário)

Se você tiver recursos de áudio:

1. Criar bucket `audio` - Marcar como público
2. Adicionar as mesmas policies (substituindo 'photos' por 'audio')

## Solução via SQL (Alternativa)

Se preferir via SQL, execute no **SQL Editor do Dashboard** (não via API):

```sql
-- Habilitar RLS na tabela storage.objects (se ainda não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Criar policies para photos
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

CREATE POLICY "Users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

-- Criar policies para profiles
CREATE POLICY "Users can upload profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Anyone can view profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Users can delete profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');
```

## Verificar se Funcionou

Após configurar:

1. Teste fazer upload de uma foto no app
2. Se ainda der erro, verifique:
   - O bucket está marcado como "Public"
   - As policies foram criadas corretamente
   - Você está autenticado no app

## Troubleshooting

### "must be owner of relation objects"
Você tentou executar via cliente SQL normal. Use o **SQL Editor do Dashboard**.

### Ainda dá erro após configurar
1. Verifique se está autenticado: `supabase.auth.getSession()`
2. Verifique se o bucket_id está correto no código
3. Verifique os logs no Supabase Dashboard → Logs

### Bucket não aparece
1. Crie via interface: Storage → New bucket
2. Nome exato: `photos`, `profiles`, `audio`
3. Marque "Public bucket"

## Buckets Necessários para o App

| Bucket    | Público | Usado Para           |
|-----------|---------|----------------------|
| photos    | ✅ Sim  | Fotos da galeria     |
| profiles  | ✅ Sim  | Fotos de perfil      |
| audio     | ✅ Sim  | Gravações de áudio   |

---

**Dica:** Sempre marque os buckets como públicos para facilitar o acesso às imagens no app.
