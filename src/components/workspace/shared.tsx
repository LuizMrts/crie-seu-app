import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, BriefcaseBusiness, Check, ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function Brand({ light = true }: { light?: boolean }) {
  return <div className={`brand ${light ? '' : 'auth-brand'}`}><span className="brand-symbol"><BriefcaseBusiness strokeWidth={1.6}/></span><span>negócio<span className="font-normal"> em</span> ordem<small>SEU NEGÓCIO, NO SEU CONTROLE.</small></span></div>;
}
export function Status({ value }: { value: string }) {
  const tone = ['Aprovado','Concluído','Pago'].includes(value) ? 'success' : ['Pendente','Aguardando resposta','Agendado'].includes(value) ? 'warning' : ['Recusado','Cancelado','Expirado'].includes(value) ? 'danger' : value === 'Rascunho' ? 'neutral' : '';
  return <span className={`status ${tone}`}>{value}</span>;
}
export function EmptyState({ icon: Icon = ClipboardList, title, description, action, onAction }: { icon?: LucideIcon; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon/></span><h3>{title}</h3><p>{description}</p>{action && <Button className="empty-action" variant="link" onClick={onAction}>{action}<ArrowUpRight className="size-3"/></Button>}</div>;
}
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function ToolAction({ label, children, onClick, disabled = false }: { label: string; children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Button type="button" variant="ghost" size="icon" title={label} aria-label={label} disabled={disabled} onClick={onClick}>{children}</Button>;
}
export function WelcomeArt() {
  return <svg viewBox="0 0 230 170" className="welcome-art" aria-hidden="true" fill="none"><path d="M25 143h179" stroke="var(--banner-art)" strokeWidth="2"/><path d="M162 37l24-11 17 37-24 11z" fill="var(--banner-art)"/><rect x="52" y="32" width="106" height="113" rx="8" transform="rotate(-9 52 32)" fill="var(--banner-art)"/><rect x="64" y="29" width="105" height="116" rx="8" fill="var(--primary-foreground)" stroke="var(--primary)" strokeWidth="1.5"/><path d="M100 24h34a5 5 0 015 5v9H95v-9a5 5 0 015-5z" fill="var(--primary)"/><path d="M97 59h49M97 85h49M97 111h33" stroke="var(--border)" strokeWidth="4" strokeLinecap="round"/><rect x="77" y="54" width="11" height="11" rx="2" fill="var(--success-soft)"/><path d="M79 59l3 3 4-5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="77" y="80" width="11" height="11" rx="2" fill="var(--success-soft)"/><path d="M79 85l3 3 4-5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="77" y="106" width="11" height="11" rx="2" fill="var(--info-soft)"/><rect x="140" y="101" width="65" height="45" rx="6" fill="var(--primary)"/><path d="M143 112h60" stroke="var(--primary-foreground)" strokeOpacity=".3" strokeWidth="2"/><rect x="178" y="117" width="31" height="17" rx="4" fill="var(--navy)"/><circle cx="186" cy="125" r="2" fill="var(--primary-foreground)"/><circle cx="49" cy="115" r="15" fill="var(--success-soft)" stroke="var(--success)" strokeWidth="1.5"/><path d="M49 106v18m4-14c-6-3-10 3-4 5 7 2 3 8-3 5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round"/><path d="M185 51v12m-6-6h12M39 65v8m-4-4h8" stroke="var(--primary)" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/></svg>;
}
export const DoneMark = () => <Check className="size-3 text-success"/>;
