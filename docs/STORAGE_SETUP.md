# Configuração do Supabase Storage

## Problema: "new row violates row-level security policy"

Esse erro acontece quando as policies de storage estão bloqueando uploads. Siga os passos abaixo para corrigir.

## Solução Rápida (via Interface)

### 1. Acessar Storage no Supabase Dashboard

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **Storage** no menu lateral

### 2. Configurar o Bucket "gallery"

#### O bucket já deve existir. Se não existir:
1. Clique em "New bucket"
2. Nome: `gallery`
3. Marque "Public bucket" ✅
4. Clique em "Create bucket"

#### Configurar Policies:
1. Clique no bucket `gallery`
2. Vá para a aba **Policies**
3. Clique em "New Policy"

**Policy 1: Upload de Fotos**
- Name: `Users can upload to gallery`
- Policy Command: `INSERT`
- Policy Definition:
```sql
bucket_id = 'gallery' AND auth.uid() IS NOT NULL
```

**Policy 2: Leitura de Fotos**
- Name: `Anyone can view gallery`
- Policy Command: `SELECT`
- Policy Definition:
```sql
bucket_id = 'gallery'
```

**Policy 3: Delete de Fotos (Opcional)**
- Name: `Users can delete from gallery`
- Policy Command: `DELETE`
- Policy Definition:
```sql
bucket_id = 'gallery' AND auth.uid() IS NOT NULL
```

### 3. Configurar o Bucket "profiles"

Repita o mesmo processo para o bucket `profiles`:

#### O bucket já deve existir. Configure as policies:

1. Clique no bucket `profiles`
2. Vá para **Policies**
3. Adicione as policies:

**Policy 1: Upload**
- Policy Command: `INSERT`
- Definition:
```sql
bucket_id = 'profiles' AND auth.uid() IS NOT NULL
```

**Policy 2: Leitura**
- Policy Command: `SELECT`
- Definition:
```sql
bucket_id = 'profiles'
```

**Policy 3: Delete**
- Policy Command: `DELETE`
- Definition:
```sql
bucket_id = 'profiles' AND auth.uid() IS NOT NULL
```

### 4. Bucket "audio" (Não é necessário no momento)

O app atualmente não usa bucket de áudio. Você só precisa de:
- `gallery` - Fotos da galeria
- `profiles` - Fotos de perfil

## Solução via SQL (Alternativa)

Se preferir via SQL, execute no **SQL Editor do Dashboard** (não via API):

```sql
-- Habilitar RLS na tabela storage.objects (se ainda não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Criar policies para gallery
CREATE POLICY "Users can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Anyone can view gallery"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

CREATE POLICY "Users can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

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
| gallery   | ✅ Sim  | Fotos da galeria     |
| profiles  | ✅ Sim  | Fotos de perfil      |

---

**Dica:** Sempre marque os buckets como públicos para facilitar o acesso às imagens no app.
