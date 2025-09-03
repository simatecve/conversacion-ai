import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Phone, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  DollarSign,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalLeads: 0,
    totalCampaigns: 0,
    activeConnections: 0,
    newUsersThisMonth: 0,
    messagesThisMonth: 0,
    conversationsThisMonth: 0,
    leadsThisMonth: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Fetch all statistics in parallel
      const [usersResult, conversationsResult, messagesResult, leadsResult, campaignsResult, connectionsResult] = await Promise.all([
        // Total users
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        // Total conversations
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        // Total messages
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        // Total leads
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        // Total campaigns
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        // Active WhatsApp connections
        supabase.from('whatsapp_connections').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      // Fetch monthly statistics
      const [newUsersResult, messagesMonthResult, conversationsMonthResult, leadsMonthResult] = await Promise.all([
        // New users this month
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        // Messages this month
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        // Conversations this month
        supabase.from('conversations').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        // Leads this month
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalLeads: leadsResult.count || 0,
        totalCampaigns: campaignsResult.count || 0,
        activeConnections: connectionsResult.count || 0,
        newUsersThisMonth: newUsersResult.count || 0,
        messagesThisMonth: messagesMonthResult.count || 0,
        conversationsThisMonth: conversationsMonthResult.count || 0,
        leadsThisMonth: leadsMonthResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      title: "Total de Usuarios",
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.newUsersThisMonth} este mes`,
      trend: stats.newUsersThisMonth > 0 ? 'up' : 'neutral',
      icon: <Users className="h-6 w-6" />,
      description: "Usuarios registrados en el sistema"
    },
    {
      title: "Conversaciones",
      value: stats.totalConversations.toLocaleString(),
      change: `+${stats.conversationsThisMonth} este mes`,
      trend: stats.conversationsThisMonth > 0 ? 'up' : 'neutral',
      icon: <MessageSquare className="h-6 w-6" />,
      description: "Total de conversaciones activas"
    },
    {
      title: "Mensajes",
      value: stats.totalMessages.toLocaleString(),
      change: `+${stats.messagesThisMonth} este mes`,
      trend: stats.messagesThisMonth > 0 ? 'up' : 'neutral',
      icon: <Phone className="h-6 w-6" />,
      description: "Mensajes enviados y recibidos"
    },
    {
      title: "Leads",
      value: stats.totalLeads.toLocaleString(),
      change: `+${stats.leadsThisMonth} este mes`,
      trend: stats.leadsThisMonth > 0 ? 'up' : 'neutral',
      icon: <Target className="h-6 w-6" />,
      description: "Leads generados en el sistema"
    },
    {
      title: "Campañas",
      value: stats.totalCampaigns.toLocaleString(),
      icon: <Zap className="h-6 w-6" />,
      description: "Campañas de marketing creadas"
    },
    {
      title: "Conexiones Activas",
      value: stats.activeConnections.toLocaleString(),
      icon: <Activity className="h-6 w-6" />,
      description: "Conexiones de WhatsApp activas"
    }
  ];

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-8 w-8" />
              Estadísticas del Sistema
            </h1>
            <p className="text-gray-600 mt-2">Resumen general de la actividad y métricas clave</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Actualizado: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  {stat.change && (
                    <div className={`flex items-center space-x-1 text-sm ${getTrendColor(stat.trend)}`}>
                      {getTrendIcon(stat.trend)}
                      <span>{stat.change}</span>
                    </div>
                  )}
                  {stat.description && (
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Actividad del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Nuevos usuarios</span>
                  </div>
                  <Badge variant="secondary">{stats.newUsersThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Conversaciones</span>
                  </div>
                  <Badge variant="secondary">{stats.conversationsThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Mensajes</span>
                  </div>
                  <Badge variant="secondary">{stats.messagesThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Leads generados</span>
                  </div>
                  <Badge variant="secondary">{stats.leadsThisMonth}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conexiones WhatsApp</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{stats.activeConnections} activas</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base de datos</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Operativa</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Servicios API</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Funcionando</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Última actualización</span>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium">Gestionar Usuarios</h3>
                <p className="text-sm text-gray-500">Ver y administrar cuentas</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium">Ver Conversaciones</h3>
                <p className="text-sm text-gray-500">Monitorear chats activos</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h3 className="font-medium">Planes de Pago</h3>
                <p className="text-sm text-gray-500">Configurar suscripciones</p>
              </div>
              <div className="text-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium">Configuración</h3>
                <p className="text-sm text-gray-500">Ajustes del sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default AdminStatistics;