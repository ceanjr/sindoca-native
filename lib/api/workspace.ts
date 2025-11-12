import { supabase } from '../supabase/client';

export interface CreateWorkspaceData {
  name: string;
  secretQuestion: string;
  secretAnswer: string;
}

/**
 * Generate unique invite code
 */
async function generateUniqueInviteCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('invite_code', code)
      .single();

    if (!data) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * Get user workspaces
 */
export async function getUserWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(
      `
      workspace_id,
      role,
      joined_at,
      workspaces (
        id,
        name,
        invite_code,
        creator_id,
        partner_id,
        status,
        created_at
      )
    `
    )
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select(
      `
      *,
      workspace_members (
        user_id,
        role,
        profiles (
          id,
          full_name,
          nickname,
          avatar_url
        )
      )
    `
    )
    .eq('id', workspaceId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get workspace content
 */
export async function getWorkspaceContent(workspaceId: string, type?: string) {
  let query = supabase
    .from('content')
    .select(
      `
      *,
      profiles:author_id (
        id,
        full_name,
        nickname,
        avatar_url
      ),
      reactions (
        id,
        type,
        user_id,
        comment
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Add content to workspace
 */
export async function addContent(
  workspaceId: string,
  authorId: string,
  contentData: {
    type: string;
    title?: string;
    description?: string;
    data?: any;
    storagePath?: string;
    category?: string;
  }
) {
  const { data, error } = await supabase
    .from('content')
    .insert({
      workspace_id: workspaceId,
      author_id: authorId,
      ...contentData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete content
 */
export async function deleteContent(contentId: string) {
  const { error } = await supabase.from('content').delete().eq('id', contentId);
  if (error) throw error;
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(contentId: string, userId: string) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .eq('type', 'favorite')
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false;
  } else {
    // Add favorite
    const { error } = await supabase.from('reactions').insert({
      content_id: contentId,
      user_id: userId,
      type: 'favorite',
    });

    if (error) throw error;
    return true;
  }
}

/**
 * Add comment/reaction
 */
export async function addReaction(
  contentId: string,
  userId: string,
  type: string,
  comment?: string
) {
  const { data, error } = await supabase
    .from('reactions')
    .insert({
      content_id: contentId,
      user_id: userId,
      type,
      comment,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
