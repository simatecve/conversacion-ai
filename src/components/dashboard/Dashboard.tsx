import React from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Dashboard = () => {
  const recentLeads = [
    { id: 1, name: 'María González', company: 'Tech Solutions', status: 'Nuevo', time: '5 min', phone: '+54 9 11 1234-5678' },
    { id: 2, name: 'Carlos Rodríguez', company: 'Marketing Digital', status: 'Contactado', time: '15 min', phone: '+54 9 11 8765-4321' },
    { id: 3, name: 'Ana Martínez', company: 'Consultoría', status: 'Calificado', time: '30 min', phone: '+54 9 11 5555-1234' },
    { id: 4, name: 'Luis García', company: 'Desarrollo Web', status: 'Propuesta', time: '1h', phone: '+54 9 11 9999-8888' },
  ];

  const activeConversations = [
    { id: 1, contact: 'Pedro Silva', message: 'Hola, necesito información sobre...', time: '2 min', unread: 3 },
    { id: 2, contact: 'Laura Jiménez', message: '¿Cuándo podríamos agendar una...', time: '8 min', unread: 1 },
    { id: 3, contact: 'Roberto Torres', message: 'Perfecto, quedamos entonces...', time: '12 min', unread: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nuevo': return 'bg-blue-500 hover:bg-blue-600';
      case 'Contactado': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Calificado': return 'bg-green-500 hover:bg-green-600';
      case 'Propuesta': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Principal</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido de vuelta. Aquí tienes un resumen de tu actividad comercial.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Último sync: hace 2 min
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Leads Totales"
          value="1,247"
          change={{ value: 12.5, trend: 'up' }}
          icon={Target}
          gradient
        />
        <StatsCard
          title="Conversaciones Activas"
          value="89"
          change={{ value: 8.3, trend: 'up' }}
          icon={MessageSquare}
        />
        <StatsCard
          title="Tasa de Conversión"
          value="24.6%"
          change={{ value: 3.2, trend: 'up' }}
          icon={TrendingUp}
        />
        <StatsCard
          title="Mensajes Enviados"
          value="3,421"
          change={{ value: 5.8, trend: 'down' }}
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Leads Recientes
              </span>
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{lead.name}</h4>
                      <span className="text-xs text-muted-foreground">{lead.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lead.phone}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Conversations */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-accent" />
                Conversaciones Activas
              </span>
              <Button variant="ghost" size="sm">
                Ver chat
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeConversations.map((conv) => (
                <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-success rounded-full flex items-center justify-center text-white font-medium">
                      {conv.contact.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground truncate">{conv.contact}</h4>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.message}</p>
                    </div>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground ml-2">
                      {conv.unread}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-warning" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Nuevo Contacto</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Enviar Mensaje</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Target className="h-6 w-6" />
                <span className="text-sm">Crear Campaña</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card className="bg-gradient-hero text-white border-0 shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Asistente IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-white/90">
                  <strong>Recomendación:</strong> Tienes 3 leads sin contactar desde hace más de 24 horas.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-white/90">
                  <strong>Oportunidad:</strong> El mejor momento para enviar mensajes es entre 10-12h.
                </p>
              </div>
              <Button variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                Ver más insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};