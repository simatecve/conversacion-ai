import React from 'react';
import { Bell, Search, Sun, Moon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const Header = () => {
  return (
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left section - Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads, conversaciones o contactos..."
              className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick action button */}
          <Button 
            size="sm" 
            className="bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Theme toggle */}
          <Button variant="ghost" size="sm">
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
          </Button>

          {/* User avatar */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Admin Usuario</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};