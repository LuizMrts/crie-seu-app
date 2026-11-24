import type { Tables } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type Quote = Tables<'quotes'>;
export type Service = Tables<'services'>;
export type Transaction = Tables<'transactions'>;
export type Profile = Tables<'profiles'>;
export type Resource = 'clients' | 'quotes' | 'services' | 'transactions';
export type Workspace = { clients: Client[]; quotes: Quote[]; services: Service[]; transactions: Transaction[]; profile: Profile | null };
export const EMPTY_WORKSPACE: Workspace = { clients: [], quotes: [], services: [], transactions: [], profile: null };
export const QUOTE_STATUSES = ['Rascunho', 'Enviado', 'Aguardando resposta', 'Aprovado', 'Recusado', 'Expirado'];
export const SERVICE_STATUSES = ['Pendente', 'Agendado', 'Em andamento', 'Concluído', 'Cancelado'];
export const LAUNCH_PRICE = 29.90;
export const money = (value: number | null | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
export const dateBR = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value.length === 10 ? `${value}T12:00:00` : value)) : 'Não definido';
export const todayISO = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
export const monthISO = (offset = 0) => { const date = new Date(); date.setMonth(date.getMonth() + offset, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}`; };
export const monthLabel = (month: string) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-15T12:00:00`));
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'VO';
export const quoteNumber = (quote: Pick<Quote, 'number'>) => `ORC-${String(quote.number).padStart(4, '0')}`;
export function quoteTotal(input: { materials: number; labor: number; travel: number; discount: number }) {
  return Math.max(0, Math.round((input.materials + input.labor + input.travel - input.discount) * 100) / 100);
}
export function effectiveQuoteStatus(quote: Pick<Quote, 'status' | 'valid_until'>, today = todayISO()) {
  return ['Enviado', 'Aguardando resposta'].includes(quote.status) && quote.valid_until && quote.valid_until < today ? 'Expirado' : quote.status;
}
export const canConvertQuote = (status: string) => status === 'Aprovado';
export function whatsappUrl(phone: string, message = '') {
  let number = phone.replace(/\D/g, '');
  if (number.length === 10 || number.length === 11) number = `55${number}`;
  return number.length >= 12 && number.length <= 15 ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
export function financialSummary(data: Pick<Workspace, 'transactions' | 'services'>, month: string) {
  const received = data.transactions.filter(t => t.type === 'Receita' && t.status === 'Pago' && t.paid_date?.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
  const expenses = data.transactions.filter(t => t.type === 'Despesa' && t.status === 'Pago' && t.paid_date?.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
  const pending = data.transactions.filter(t => t.type === 'Receita' && t.status === 'Pendente' && t.due_date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
  const billed = data.services.filter(s => s.status !== 'Cancelado' && s.start_date?.startsWith(month)).reduce((sum, s) => sum + s.value, 0);
  return { received, expenses, pending, billed, result: received - expenses };
}
export function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23503') return 'Este cadastro tem vínculos. Exclua primeiro os serviços e orçamentos associados.';
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (message.includes('User already registered')) return 'Este e-mail já possui uma conta.';
    if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (message.includes('Password should')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (message.includes('Apenas orçamentos')) return message;
  }
  return 'Não foi possível concluir. Confira sua conexão e tente novamente.';
}
