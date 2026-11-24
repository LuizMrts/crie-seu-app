import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Users, FileText, Wrench, Wallet, Settings, ChevronRight, ChevronDown, Home, Menu, X, LogOut, ArrowUpRight, CircleHelp, ShieldCheck, Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { initials } from '@/lib/business';
import { Brand } from './shared';

const nav = [ { to: '/painel', label: 'Visão geral', icon: LayoutDashboard }, { to: '/clientes', label: 'Clientes', icon: Users }, { to: '/orcamentos', label: 'Orçamentos', icon: FileText }, { to: '/servicos', label: 'Serviços', icon: Wrench }, { to: '/financeiro', label: 'Financeiro', icon: Wallet } ] as const;
export function WorkspaceShell({ children, title, name }: { children: ReactNode; title?: string; name?: string }) {
  const [mobile, setMobile] = useState(false);
  const [help, setHelp] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [account, setAccount] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: location => location.pathname });
  const queryClient = useQueryClient();
  const displayName = name || user?.user_metadata['name'] || user?.user_metadata['full_name'] || 'Minha conta';
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: '/auth', replace: true });
  }
  return <div>
    {mobile && <div className="mobile-overlay" onClick={() => setMobile(false)}/>}
    <aside className={`app-sidebar ${mobile ? 'mobile-open' : ''}`}>
      <div className="px-5 pt-7 pb-4"><Link to="/" aria-label="Negócio em Ordem — início"><Brand/></Link></div>
      <p className="sidebar-label">Seu espaço de trabalho</p>
      <nav aria-label="Menu principal">{nav.map(item => <Link key={item.to} to={item.to} onClick={() => setMobile(false)} className={`nav-item ${pathname === item.to || (item.to === '/painel' && pathname === '/') ? 'active' : ''}`}><item.icon/>{item.label}{item.to === '/painel' && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground"/>}</Link>)}</nav>
      <div className="mt-4 border-t border-sidebar-border mx-5"/>
      <Link to="/configuracoes" onClick={() => setMobile(false)} className={`nav-item ${pathname === '/configuracoes' ? 'active' : ''}`}><Settings/>Configurações</Link>
      <div className="mt-auto"><div className="sidebar-help"><CircleHelp className="size-5"/><h3>Uma mãozinha por aqui?</h3><p>Conte com a gente para manter<br/>seu negócio em ordem.</p><a href="#ajuda" onClick={event => { event.preventDefault(); setHelp(true); }}>Central de ajuda <ArrowUpRight className="size-3"/></a></div><div className="border-t border-sidebar-border px-5 py-4 flex items-center gap-2 text-[10px]"><span className="size-1.5 rounded-full bg-success"/>Tudo certo por aqui<span className="ml-auto opacity-50">v1.0</span></div></div>
    </aside>
    <div className="app-main"><header className="topbar"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="mobile-menu-button" aria-label={mobile ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</Button><div className="breadcrumb"><Home className="size-3.5"/><span>Meu negócio</span><ChevronRight className="size-3"/><strong>{title ?? 'Início'}</strong></div></div><div className="topbar-actions"><div className="relative"><Button size="icon" variant="ghost" aria-label="Notificações" title="Notificações" onClick={() => setNotifications(!notifications)}><Bell className="text-muted-foreground size-[18px]"/></Button>{notifications && <div className="quick-menu w-64 p-4"><p className="font-semibold text-xs mb-3">Notificações</p><div className="flex gap-2 items-center text-xs text-muted-foreground"><CheckCheck className="size-4 text-success"/>Nenhuma notificação por enquanto.</div></div>}</div><div className="topbar-divider"/>{user ? <div className="relative"><Button variant="ghost" className="h-auto p-0 gap-2.5" onClick={() => setAccount(!account)}><span className="user-avatar">{initials(displayName)}</span><span className="text-left topbar-user-text"><strong className="block text-[11px] font-semibold">{displayName}</strong><span className="block text-[9px] text-muted-foreground mt-1">Meu negócio</span></span><ChevronDown className="size-3 text-muted-foreground"/></Button>{account && <div className="quick-menu"><Button variant="ghost" asChild><Link to="/configuracoes"><Settings/>Minha conta</Link></Button><Button variant="ghost" onClick={signOut}><LogOut/>Sair da conta</Button></div>}</div> : <Button asChild variant="ghost" className="text-xs p-0 gap-2.5"><Link to="/auth"><span className="user-avatar">VO</span><span>Entrar na conta</span><ChevronRight className="size-3"/></Link></Button>}</div></header>
      <main className="workspace-body page-enter">{children}<footer className="workspace-footer"><span>© {new Date().getFullYear()} Negócio em Ordem. Feito para quem faz acontecer.</span><span><ShieldCheck className="size-3 text-success"/>Seus dados seguros. Seu negócio no controle.</span></footer></main>
    </div>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Central de ajuda</DialogTitle><DialogDescription>Seu negócio, um passo de cada vez.</DialogDescription></DialogHeader><div className="space-y-5 text-xs leading-6"><div><h3 className="font-semibold">Por onde começar?</h3><p className="text-muted-foreground">Cadastre um cliente, crie um orçamento e, quando ele for aprovado, transforme-o em serviço.</p></div><div><h3 className="font-semibold">Como funciona o financeiro?</h3><p className="text-muted-foreground">Faturamento é o valor dos serviços com início no mês. Recebimentos são as receitas pagas. O resultado financeiro é o que você recebeu menos as despesas pagas.</p></div><div><h3 className="font-semibold">Como enviar um orçamento?</h3><p className="text-muted-foreground">Na lista de orçamentos, use o ícone de PDF para baixar o documento ou o de conversa para abrir o WhatsApp do cliente.</p></div></div></DialogContent></Dialog>
  </div>;
}
