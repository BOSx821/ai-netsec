import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Bell, Bot, ChartNoAxesCombined, FileBarChart2, LayoutDashboard, LogOut, PanelLeft, ScrollText, Search, ShieldAlert, ShieldCheck, type LucideIcon, Users, X } from "lucide-react";
import { type CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type NavigationItem = { icon: LucideIcon; label: string; path: string; adminOnly?: boolean };
type NavigationGroup = { label: string; items: NavigationItem[] };

const menuGroups: NavigationGroup[] = [
  { label: "Workspace", items: [{ icon: LayoutDashboard, label: "Posture SOC", path: "/" }] },
  { label: "Monitor", items: [{ icon: ShieldAlert, label: "Alertes", path: "/alerts" }, { icon: Users, label: "Actifs", path: "/assets" }] },
  { label: "Response", items: [{ icon: ShieldCheck, label: "Incidents", path: "/incidents" }] },
  { label: "Intelligence", items: [{ icon: ChartNoAxesCombined, label: "Analyse des risques", path: "/analysis" }, { icon: Bot, label: "Assistant IA", path: "/assistant" }] },
  { label: "Governance", items: [{ icon: FileBarChart2, label: "Rapports", path: "/reports" }, { icon: ScrollText, label: "Administration", path: "/admin", adminOnly: true }] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width-compact";
const DEFAULT_WIDTH = 216;
const MIN_WIDTH = 200;
const MAX_WIDTH = 300;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <main className="soc-login-shell"><section className="soc-login-panel"><div className="soc-brand-mark"><ShieldCheck className="size-6" /></div><p className="soc-eyebrow">AI-NETSEC · accès protégé</p><h1>Connexion requise</h1><p>La plateforme SOC est réservée aux utilisateurs authentifiés. Votre session et vos autorisations sont vérifiées avant l’accès aux données de sécurité.</p><Button onClick={() => startLogin()} size="lg" className="w-full">Se connecter à la plateforme</Button></section></main>;

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [search, setSearch] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const visibleGroups = menuGroups.map(group => ({ ...group, items: group.items.filter(item => !item.adminOnly || user?.role === "admin") })).filter(group => group.items.length > 0);
  const searchableItems = visibleGroups.flatMap(group => group.items);
  const activeMenuItem = searchableItems.find(item => item.path === location);

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const nextWidth = event.clientX - sidebarLeft;
      if (nextWidth >= MIN_WIDTH && nextWidth <= MAX_WIDTH) setSidebarWidth(nextWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = search.trim().toLocaleLowerCase("fr-FR");
    if (!normalized) return;
    const match = searchableItems.find(item => item.label.toLocaleLowerCase("fr-FR").includes(normalized));
    if (match) { setLocation(match.path); setSearch(""); }
  };

  return <>
    <div className="relative" ref={sidebarRef}>
      <Sidebar collapsible="icon" className="soc-sidebar soc-sidebar-compact" disableTransition={isResizing}>
        <SidebarHeader className="soc-sidebar-header soc-sidebar-header-compact"><div className="flex w-full items-center gap-2 px-2"><div className="soc-brand-compact"><span>AI-NETSEC</span><small>SOC</small></div><button onClick={toggleSidebar} className="soc-icon-button ml-auto shrink-0" aria-label="Basculer la navigation"><PanelLeft className="size-4" /></button></div></SidebarHeader>
        <SidebarContent className="soc-sidebar-content soc-sidebar-content-compact">{visibleGroups.map(group => <section key={group.label} className="soc-nav-group"><p className="soc-nav-group-label">{group.label}</p><SidebarMenu className="px-2">{group.items.map(item => { const isActive = item.path === location; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} aria-current={isActive ? "page" : undefined} className="soc-nav-item"><item.icon className="size-4" aria-hidden="true" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></section>)}</SidebarContent>
        <SidebarFooter className="soc-sidebar-footer soc-sidebar-footer-compact"><DropdownMenu><DropdownMenuTrigger asChild><button className="soc-profile-trigger" aria-label="Ouvrir le menu utilisateur"><Avatar className="size-8 shrink-0 border border-cyan-400/20 bg-cyan-400/10"><AvatarFallback className="bg-cyan-400/10 text-[11px] font-semibold text-cyan-100">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p>{user?.name || "Utilisateur"}</p><span>{user?.role === "admin" ? "Administrateur SOC" : "Analyste sécurité"}</span></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Se déconnecter</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
      </Sidebar>
      <div className={`soc-resize-handle ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} aria-hidden="true" />
    </div>
    <SidebarInset className="soc-app-inset soc-app-inset-compact">
      <header className="soc-topbar soc-topbar-compact"><div className="flex min-w-0 items-center gap-3">{isMobile ? <SidebarTrigger className="soc-icon-button" /> : null}<div className="soc-mobile-context"><p className="soc-topbar-label">Security workspace</p><p className="soc-topbar-title">{activeMenuItem?.label ?? "AI-NETSEC"}</p></div><form className="soc-global-search" onSubmit={submitSearch} role="search"><Search className="size-3.5" aria-hidden="true" /><input aria-label="Rechercher une section" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une section…" type="search" />{search ? <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche"><X className="size-3.5" /></button> : null}</form></div><div className="soc-topbar-actions"><button className="soc-topbar-action" onClick={() => setLocation("/alerts")} aria-label="Ouvrir les alertes" title="Alertes"><Bell className="size-4" /></button><button className="soc-topbar-action" onClick={() => setLocation("/assistant")} aria-label="Ouvrir l’assistant IA" title="Assistant IA"><Bot className="size-4" /></button><span className="soc-live-status"><span aria-hidden="true" />Supervision</span></div></header>
      <main className="soc-main soc-main-compact">{children}</main>
    </SidebarInset>
  </>;
}
