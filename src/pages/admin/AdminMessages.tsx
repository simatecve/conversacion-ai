import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageDirection = Database['public']['Enums']['message_direction'];
type MessageStatus = Database['public']['Enums']['message_status'];

interface MessageWithDetails extends Message {
  conversation?: {
    contact_name?: string;
    contact_phone?: string;
  };
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesPerPage = 50;
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [currentPage, directionFilter, statusFilter, dateFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('messages')
        .select(`
          *,
          conversations!inner(
            contact_name,
            contact_phone
          ),
          profiles(
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage - 1);

      // Apply filters
      if (directionFilter !== 'all') {
        query = query.eq('direction', directionFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setMessages(data || []);
      setTotalMessages(count || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MessageStatus) => {
    const variants: Record<MessageStatus, 'default' | 'secondary' | 'destructive'> = {
      sent: 'default',
      delivered: 'default',
      read: 'default',
      failed: 'destructive',
      pending: 'secondary'
    };
    
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status === 'sent' && 'Enviado'}
        {status === 'delivered' && 'Entregado'}
        {status === 'read' && 'Leído'}
        {status === 'failed' && 'Fallido'}
        {status === 'pending' && 'Pendiente'}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: MessageDirection) => {
    return direction === 'outbound' ? (
      <Send className="h-4 w-4 text-blue-500" />
    ) : (
      <Download className="h-4 w-4 text-green-500" />
    );
  };

  const filteredMessages = messages.filter(message => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      message.content?.toLowerCase().includes(searchLower) ||
      message.conversation?.contact_name?.toLowerCase().includes(searchLower) ||
      message.conversation?.contact_phone?.includes(searchTerm) ||
      message.profile?.first_name?.toLowerCase().includes(searchLower) ||
      message.profile?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalMessages / messagesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando mensajes...</p>
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
              <MessageSquare className="mr-3 h-8 w-8" />
              Mensajes del Sistema
            </h1>
            <p className="text-gray-600 mt-2">Monitorea todos los mensajes enviados y recibidos</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {totalMessages.toLocaleString()} mensajes
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Dirección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las direcciones</SelectItem>
                  <SelectItem value="inbound">Entrantes</SelectItem>
                  <SelectItem value="outbound">Salientes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="read">Leído</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mensaje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Dirección</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((message) => (
                    <tr key={message.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate">
                            {message.content || 'Sin contenido'}
                          </p>
                          {message.media_url && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Media
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {message.conversation?.contact_name || 'Sin nombre'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {message.conversation?.contact_phone || 'Sin teléfono'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {message.profile ? 
                            `${message.profile.first_name || ''} ${message.profile.last_name || ''}`.trim() || 'Sin nombre' :
                            'Sistema'
                          }
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(message.direction)}
                          <span className="text-sm capitalize">
                            {message.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status)}
                          {getStatusBadge(message.status)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <div>
                            <div>{new Date(message.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMessages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron mensajes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * messagesPerPage) + 1} a {Math.min(currentPage * messagesPerPage, totalMessages)} de {totalMessages} mensajes
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
  );
};

export default AdminMessages;