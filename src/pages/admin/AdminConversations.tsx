import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationStatus = Database['public']['Enums']['conversation_status'];

interface ConversationWithDetails extends Conversation {
  profile?: {
    first_name?: string;
    last_name?: string;
  };
  _count?: {
    messages: number;
  };
  last_message?: {
    content?: string;
    created_at: string;
    direction: string;
  };
}

const AdminConversations = () => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const conversationsPerPage = 25;
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, [currentPage, statusFilter, dateFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('conversations')
        .select(`
          *,
          profiles(
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((currentPage - 1) * conversationsPerPage, currentPage * conversationsPerPage - 1);

      // Apply filters
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
      
      // Fetch message counts and last messages for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get message count
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, direction')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            _count: {
              messages: messageCount || 0
            },
            last_message: lastMessage
          };
        })
      );
      
      setConversations(conversationsWithDetails);
      setTotalConversations(count || 0);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ConversationStatus) => {
    const variants: Record<ConversationStatus, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      closed: 'secondary',
      pending: 'secondary'
    };
    
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status === 'active' && 'Activa'}
        {status === 'closed' && 'Cerrada'}
        {status === 'pending' && 'Pendiente'}
      </Badge>
    );
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.contact_name?.toLowerCase().includes(searchLower) ||
      conversation.contact_phone?.includes(searchTerm) ||
      conversation.profile?.first_name?.toLowerCase().includes(searchLower) ||
      conversation.profile?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalConversations / conversationsPerPage);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando conversaciones...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="mr-3 h-8 w-8" />
              Conversaciones del Sistema
            </h1>
            <p className="text-gray-600 mt-2">Monitorea todas las conversaciones de la plataforma</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {totalConversations.toLocaleString()} conversaciones
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
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

        {/* Conversations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Conversaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Usuario Asignado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Mensajes</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Último Mensaje</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConversations.map((conversation) => (
                    <tr key={conversation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {conversation.contact_name || 'Sin nombre'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {conversation.contact_phone || 'Sin teléfono'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {conversation.profile ? 
                              `${conversation.profile.first_name || ''} ${conversation.profile.last_name || ''}`.trim() || 'Sin nombre' :
                              'Sin asignar'
                            }
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(conversation.status)}
                          {getStatusBadge(conversation.status)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline" className="text-xs">
                            {conversation._count?.messages || 0} mensajes
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          {conversation.last_message ? (
                            <>
                              <p className="text-sm text-gray-900 truncate">
                                {conversation.last_message.content || 'Sin contenido'}
                              </p>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Badge 
                                  variant={conversation.last_message.direction === 'inbound' ? 'default' : 'secondary'} 
                                  className="text-xs mr-2"
                                >
                                  {conversation.last_message.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                                </Badge>
                                {new Date(conversation.last_message.created_at).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Sin mensajes</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <div>
                            <div>{new Date(conversation.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              Actualizada: {new Date(conversation.updated_at).toLocaleDateString()}
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
              {filteredConversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron conversaciones
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * conversationsPerPage) + 1} a {Math.min(currentPage * conversationsPerPage, totalConversations)} de {totalConversations} conversaciones
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
    </AdminLayout>
  );
};

export default AdminConversations;