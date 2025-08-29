import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Phone, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';

interface WhatsAppConnection {
  id: string;
  name: string;
  phone_number: string;
  color: string;
  status: string;
  created_at: string;
}

const colorOptions = [
  { name: 'Azul', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Verde', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Rojo', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Púrpura', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Naranja', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Rosa', value: '#ec4899', bg: 'bg-pink-500' },
];

const WhatsAppConnections = () => {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    color: '#3b82f6'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conexiones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone_number) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Call edge function to create WhatsApp connection
      const { data, error } = await supabase.functions.invoke('create-whatsapp-connection', {
        body: {
          name: formData.name,
          phone_number: formData.phone_number,
          color: formData.color,
          user_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Conexión creada",
        description: "La conexión de WhatsApp se creó correctamente",
      });

      setDialogOpen(false);
      setFormData({ name: '', phone_number: '', color: '#3b82f6' });
      fetchConnections();
    } catch (error: any) {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la conexión",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getColorOption = (colorValue: string) => {
    return colorOptions.find(opt => opt.value === colorValue) || colorOptions[0];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Conexiones WhatsApp</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conexiones WhatsApp</h1>
          <p className="text-muted-foreground">Gestiona tus conexiones de WhatsApp</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Conexión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Conexión de WhatsApp</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la conexión</Label>
                <Input
                  id="name"
                  placeholder="Ej: WhatsApp Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="Ej: +5491123456789"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label>Color de identificación</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                        formData.color === color.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      disabled={creating}
                    >
                      <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                disabled={creating}
              >
                {creating ? 'Creando conexión...' : 'Crear Conexión'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay conexiones</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera conexión de WhatsApp para comenzar a comunicarte con tus clientes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => {
            const colorOption = getColorOption(connection.color);
            return (
              <Card key={connection.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-4 h-4 rounded-full ${colorOption.bg}`}
                      ></div>
                      <h3 className="font-semibold">{connection.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      connection.status === 'conectado' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {connection.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {connection.phone_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creado: {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center pt-8">
        <Button variant="outline" size="sm">
          <List className="h-4 w-4 mr-2" />
          Conexiones Existentes
        </Button>
      </div>
      </div>
    </AppLayout>
  );
};

export default WhatsAppConnections;