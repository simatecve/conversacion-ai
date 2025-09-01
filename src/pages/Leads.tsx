import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, MoreVertical, Building, Mail, Phone, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import type { Tables } from '@/integrations/supabase/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import KanbanBoard from '@/components/KanbanBoard';

type LeadColumn = Tables<'lead_columns'>;
type Lead = Tables<'leads'>;

interface LeadWithColumn extends Lead {
  lead_columns?: LeadColumn;
}

const Leads = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<LeadColumn[]>([]);
  const [leads, setLeads] = useState<LeadWithColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6');
  const [editingColumn, setEditingColumn] = useState<LeadColumn | null>(null);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    notes: '',
    column_id: ''
  });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadColumns(), loadLeads()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadColumns = async () => {
    const { data, error } = await supabase
      .from('lead_columns')
      .select('*')
      .eq('user_id', user?.id)
      .order('position');

    if (error) {
      console.error('Error loading columns:', error);
      return;
    }

    if (data.length === 0) {
      // Crear columna inicial por defecto
      await createDefaultColumn();
    } else {
      setColumns(data);
    }
  };

  const createDefaultColumn = async () => {
    const { data, error } = await supabase
      .from('lead_columns')
      .insert({
        name: 'Nuevos Leads',
        color: '#3b82f6',
        position: 0,
        is_default: true,
        user_id: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default column:', error);
      return;
    }

    setColumns([data]);
  };

  const loadLeads = async () => {
    // Primero obtenemos las instancias del usuario logueado
    const { data: userInstances, error: instancesError } = await supabase
      .from('whatsapp_connections')
      .select('name')
      .eq('user_id', user?.id);

    if (instancesError) {
      console.error('Error loading user instances:', instancesError);
      return;
    }

    const instanceNames = userInstances?.map(instance => instance.name) || [];

    // Construir la consulta OR para filtrar por user_id o instancias del usuario
    let orConditions = [`user_id.eq.${user?.id}`];
    instanceNames.forEach(instanceName => {
      orConditions.push(`instancia.eq."${instanceName}"`);
    });

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_columns(*)
      `)
      .or(orConditions.join(','))
      .order('position');

    if (error) {
      console.error('Error loading leads:', error);
      return;
    }

    setLeads(data || []);
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;

    const { data, error } = await supabase
      .from('lead_columns')
      .insert({
        name: newColumnName,
        color: newColumnColor,
        position: columns.length,
        is_default: false,
        user_id: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating column:', error);
      toast({
        title: "Error",
        description: "Error al crear la columna",
        variant: "destructive"
      });
      return;
    }

    setColumns([...columns, data]);
    setNewColumnName('');
    setNewColumnColor('#3b82f6');
    setShowColumnDialog(false);
    toast({
      title: "Éxito",
      description: "Columna creada correctamente"
    });
  };

  const handleUpdateColumn = async () => {
    if (!editingColumn || !newColumnName.trim()) return;

    const { error } = await supabase
      .from('lead_columns')
      .update({
        name: newColumnName,
        color: newColumnColor
      })
      .eq('id', editingColumn.id);

    if (error) {
      console.error('Error updating column:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la columna",
        variant: "destructive"
      });
      return;
    }

    setColumns(columns.map(col => 
      col.id === editingColumn.id 
        ? { ...col, name: newColumnName, color: newColumnColor }
        : col
    ));
    setEditingColumn(null);
    setNewColumnName('');
    setNewColumnColor('#3b82f6');
    setShowColumnDialog(false);
    toast({
      title: "Éxito",
      description: "Columna actualizada correctamente"
    });
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column?.is_default) {
      toast({
        title: "Error",
        description: "No se puede eliminar la columna inicial",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('lead_columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      console.error('Error deleting column:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la columna",
        variant: "destructive"
      });
      return;
    }

    setColumns(columns.filter(col => col.id !== columnId));
    setLeads(leads.filter(lead => lead.column_id !== columnId));
    toast({
      title: "Éxito",
      description: "Columna eliminada correctamente"
    });
  };

  const handleCreateLead = async () => {
    if (!newLead.name.trim()) return;

    // Si no se especifica columna, usar la columna por defecto
    let targetColumnId = newLead.column_id;
    if (!targetColumnId) {
      const defaultColumn = columns.find(col => col.is_default);
      if (defaultColumn) {
        targetColumnId = defaultColumn.id;
      } else if (columns.length > 0) {
        targetColumnId = columns[0].id;
      } else {
        toast({
          title: "Error",
          description: "No hay columnas disponibles",
          variant: "destructive"
        });
        return;
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: newLead.name,
        email: newLead.email || null,
        phone: newLead.phone || null,
        company: newLead.company || null,
        value: newLead.value ? parseFloat(newLead.value) : null,
        notes: newLead.notes || null,
        column_id: targetColumnId,
        user_id: user?.id,
        position: leads.filter(l => l.column_id === targetColumnId).length
      })
      .select(`
        *,
        lead_columns(*)
      `)
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "Error al crear el lead",
        variant: "destructive"
      });
      return;
    }

    setLeads([...leads, data]);
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      value: '',
      notes: '',
      column_id: ''
    });
    setShowLeadDialog(false);
    toast({
      title: "Éxito",
      description: "Lead creado correctamente"
    });
  };

  const handleMoveLeadToColumn = async (leadId: string, targetColumnId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ 
        column_id: targetColumnId,
        position: leads.filter(l => l.column_id === targetColumnId).length
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error moving lead:', error);
      toast({
        title: "Error",
        description: "Error al mover el lead",
        variant: "destructive"
      });
      return;
    }

    // Update local state
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, column_id: targetColumnId }
        : lead
    ));
    
    toast({
      title: "Éxito",
      description: "Lead movido correctamente"
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el lead",
        variant: "destructive"
      });
      return;
    }

    setLeads(leads.filter(lead => lead.id !== leadId));
    toast({
      title: "Éxito",
      description: "Lead eliminado correctamente"
    });
  };

  const openEditColumnDialog = (column: LeadColumn) => {
    setEditingColumn(column);
    setNewColumnName(column.name);
    setNewColumnColor(column.color);
    setShowColumnDialog(true);
  };

  const openCreateColumnDialog = () => {
    setEditingColumn(null);
    setNewColumnName('');
    setNewColumnColor('#3b82f6');
    setShowColumnDialog(true);
  };

  const openCreateLeadDialog = (columnId: string) => {
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      value: '',
      notes: '',
      column_id: columnId
    });
    setShowLeadDialog(true);
  };



  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Gestiona tus leads en un tablero Kanban
            </p>
          </div>
          <Button onClick={openCreateColumnDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Columna
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          columns={columns}
          leads={leads}
          onEditColumn={openEditColumnDialog}
          onDeleteColumn={handleDeleteColumn}
          onCreateLead={openCreateLeadDialog}
          onEditLead={undefined}
          onDeleteLead={handleDeleteLead}
          onMoveLeadToColumn={handleMoveLeadToColumn}
        />

        {/* Column Dialog */}
        <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingColumn ? 'Editar Columna' : 'Nueva Columna'}
              </DialogTitle>
              <DialogDescription>
                {editingColumn ? 'Modifica los datos de la columna' : 'Crea una nueva columna para organizar tus leads'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="column-name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="column-name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ej: Contactados, Calificados..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="column-color" className="text-right">
                  Color
                </Label>
                <Input
                  id="column-color"
                  type="color"
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                  className="col-span-3 h-10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowColumnDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={editingColumn ? handleUpdateColumn : handleCreateColumn}>
                {editingColumn ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Dialog */}
        <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Lead</DialogTitle>
              <DialogDescription>
                Agrega un nuevo lead a la columna
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-name">Nombre *</Label>
                <Input
                  id="lead-name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  placeholder="Nombre del lead"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-phone">Teléfono</Label>
                <Input
                  id="lead-phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-company">Empresa</Label>
                <Input
                  id="lead-company"
                  value={newLead.company}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-value">Valor Estimado</Label>
                <Input
                  id="lead-value"
                  type="number"
                  value={newLead.value}
                  onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  placeholder="1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-notes">Notas</Label>
                <Textarea
                  id="lead-notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLeadDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLead}>
                Crear Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Leads;