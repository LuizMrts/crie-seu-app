import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import type { Resource, Workspace } from './business';

async function readAll<T extends Resource>(table: T, userId: string): Promise<Tables<T>[]> {
  const rows: Tables<T>[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId).order('created_at', { ascending: false }).order('id').range(start, start + 999);
    if (error) throw error;
    const page = data as unknown as Tables<T>[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}
export const workspaceOptions = (userId: string) => queryOptions({
  queryKey: ['workspace', userId],
  queryFn: async (): Promise<Workspace> => {
    const [clients, quotes, services, transactions, profile] = await Promise.all([
      readAll('clients', userId), readAll('quotes', userId), readAll('services', userId), readAll('transactions', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);
    if (profile.error) throw profile.error;
    return { clients, quotes, services, transactions, profile: profile.data };
  },
  staleTime: 30_000,
});
export async function saveRecord<T extends Resource>(table: T, payload: TablesInsert<T>, id?: string) {
  // The typed branches preserve required fields for each generated table type.
  const response = id
    ? await supabase.from(table).update(payload as never).eq('id', id).select('id').single()
    : await supabase.from(table).insert(payload as never).select('id').single();
  if (response.error) throw response.error;
  return response.data;
}
export async function deleteRecord(table: Resource, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}
