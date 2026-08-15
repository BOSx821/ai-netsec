import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Bell, Bot, ChartNoAxesCombined, FileBarChart2, LayoutDashboard, LogOut, Moon, PanelLeft, ScrollText, Search, Settings, ShieldAlert, ShieldCheck, Sun, type LucideIcon, Users, X } from "lucide-react";
import { type CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

type NavigationItem = { icon: LucideIcon; label: string; path: string; adminOnly?: boolean };
type NavigationGroup = { label: string; items: NavigationItem[] };

const menuGroups: NavigationGroup[] = [
  { label: "Overview", items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/" }] },
  { label: "Monitoring", items: [{ icon: ShieldAlert, label: "Alertes", path: "/alerts" }, { icon: Users, label: "Actifs surveillés", path: "/assets" }] },
  { label: "Response", items: [{ icon: ShieldCheck, label: "Incidents", path: "/incidents" }] },
  { label: "Intelligence", items: [{ icon: ChartNoAxesCombined, label: "Analyse des risques", path: "/analysis" }, { icon: Bot, label: "Assistant IA", path: "/assistant" }] },
  { label: "Governance", items: [{ icon: FileBarChart2, label: "Rapports", path: "/reports" }, { icon: ScrollText, label: "Journal d’audit", path: "/admin", adminOnly: true }] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width-reference";
const DEFAULT_WIDTH = 208;
const MIN_WIDTH = 196;
const MAX_WIDTH = 280;

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
  const { theme, toggleTheme } = useTheme();
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
    const handleMouseMove = (event: MouseEvent) => { if (!isResizing) return; const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0; const nextWidth = event.clientX - sidebarLeft; if (nextWidth >= MIN_WIDTH && nextWidth <= MAX_WIDTH) setSidebarWidth(nextWidth); };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const normalized = search.trim().toLocaleLowerCase("fr-FR"); if (!normalized) return; const match = searchableItems.find(item => item.label.toLocaleLowerCase("fr-FR").includes(normalized)); if (match) { setLocation(match.path); setSearch(""); } };

  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="soc-sidebar soc-reference-sidebar" disableTransition={isResizing}><SidebarHeader className="soc-reference-sidebar-header"><div className="soc-reference-brand"><strong>AI-NETSEC</strong><span>SOC</span></div><button onClick={toggleSidebar} className="soc-reference-menu-button" aria-label="Basculer la navigation"><PanelLeft className="size-4" /></button></SidebarHeader><SidebarContent className="soc-reference-sidebar-content"><DropdownMenu><DropdownMenuTrigger asChild><button className="soc-reference-profile" aria-label="Ouvrir le menu utilisateur"><Avatar className="size-14 border border-slate-500/30 bg-cyan-400/10"><AvatarFallback className="bg-cyan-400/10 text-lg font-semibold text-cyan-100">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar><strong>{user?.name || "Utilisateur"}</strong><span>{user?.role === "admin" ? "Administrateur SOC" : "Analyste sécurité"}</span></button></DropdownMenuTrigger><DropdownMenuContent align="center" className="w-52"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Se déconnecter</DropdownMenuItem></DropdownMenuContent></DropdownMenu>{visibleGroups.map(group => <section key={group.label} className="soc-reference-nav-group"><p>{group.label}</p><SidebarMenu>{group.items.map(item => { const isActive = item.path === location; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} aria-current={isActive ? "page" : undefined} className="soc-reference-nav-item"><item.icon className="size-4" aria-hidden="true" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></section>)}</SidebarContent></Sidebar><div className={`soc-resize-handle ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} aria-hidden="true" /></div><SidebarInset className="soc-reference-inset"><header className="soc-reference-topbar"><div className="flex min-w-0 items-center gap-3">{isMobile ? <SidebarTrigger className="soc-reference-menu-button" /> : null}<p className="soc-reference-mobile-title">{activeMenuItem?.label ?? "Dashboard"}</p><form className="soc-reference-search" onSubmit={submitSearch} role="search"><Search className="size-3.5" aria-hidden="true" /><input aria-label="Rechercher une section" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search" type="search" />{search ? <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche"><X className="size-3.5" /></button> : null}</form></div><div className="soc-reference-utilities"><button onClick={toggleTheme} aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"} title={theme === "dark" ? "Thème clair" : "Thème sombre"}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button><button onClick={() => setLocation("/alerts")} aria-label="Ouvrir les alertes" title="Alertes"><Bell className="size-4" /></button><button onClick={() => setLocation("/admin")} aria-label="Ouvrir l’administration" title="Administration : paramètres disponibles"><Settings className="size-4" /></button><DropdownMenu><DropdownMenuTrigger asChild><button className="soc-reference-profile-utility" aria-label="Ouvrir le profil"><Avatar className="size-6 border border-slate-500/30 bg-cyan-400/10"><AvatarFallback className="bg-cyan-400/10 text-[10px] font-semibold text-cyan-100">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer"><Settings className="mr-2 size-4" />Administration</DropdownMenuItem><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 size-4" />Se déconnecter</DropdownMenuItem></DropdownMenuContent></DropdownMenu><span className="soc-reference-live"><span aria-hidden="true" />Live</span></div></header><main className="soc-reference-main">{children}</main></SidebarInset></>;
}
