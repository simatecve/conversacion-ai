import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  UserPlus, 
  Send, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Bot,
  Phone,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import kanbanProLogo from '@/assets/kanban-pro-logo.png';

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Panel Principal', icon: LayoutDashboard, href: '/' },
    ]
  },
  {
    label: 'Comunicaciones',
    items: [
      { label: 'Conexiones WhatsApp', icon: Phone, href: '/conexiones' },
      { label: 'Conversaciones', icon: MessageSquare, href: '/conversaciones', badge: 3 },
      { label: 'Campañas Masivas', icon: Send, href: '/campanas-masivas' },
    ]
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Leads', icon: UserPlus, href: '/leads', badge: 12 },
      { label: 'Contactos', icon: Users, href: '/contactos' },
      { label: 'Asistente IA', icon: Bot, href: '/asistente-ia' },
      { label: 'Calendario', icon: Calendar, href: '/calendario' },
    ]
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Reportes', icon: BarChart3, href: '/reportes' },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configuración', icon: Settings, href: '/configuracion' },
    ]
  }
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-card rounded-lg shadow-lg border border-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300",
        "md:relative md:translate-x-0",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <img 
                  src={kanbanProLogo} 
                  alt="KanbanPRO" 
                  className="h-8 w-auto"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {isMobileOpen && (
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="md:hidden p-1 hover:bg-sidebar-accent rounded"
                >
                  <X className="h-4 w-4 text-sidebar-foreground" />
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:block p-1 hover:bg-sidebar-accent rounded transition-colors"
              >
                <Menu className="h-4 w-4 text-sidebar-foreground" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {sidebarGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-3">
                    {group.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent hover:scale-105 group",
                        item.href === '/' && "bg-sidebar-accent border border-sidebar-border shadow-sm"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        item.href === '/' 
                          ? "text-sidebar-primary" 
                          : "text-sidebar-foreground group-hover:text-sidebar-primary"
                      )} />
                      
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            "font-medium transition-colors",
                            item.href === '/'
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground group-hover:text-sidebar-primary"
                          )}>
                            {item.label}
                          </span>
                          
                          {item.badge && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className={cn(
              "flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent",
              isCollapsed && "justify-center"
            )}>
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.email}</p>
                  <p className="text-xs text-sidebar-foreground/70">Usuario</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};