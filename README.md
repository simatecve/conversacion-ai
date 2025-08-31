# KanbanPRO

Aplicación de gestión de leads y conversaciones con integración de WhatsApp e IA.

## Características

- 🔐 Autenticación segura con Supabase
- 📱 Conexiones WhatsApp
- 💬 Gestión de conversaciones
- 👥 Administración de leads y contactos
- 🤖 Asistente de IA
- 📊 Panel de control con métricas
- 📱 Diseño responsive

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase
- **Autenticación**: Supabase Auth
- **Base de datos**: PostgreSQL (Supabase)

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/simatecve/conversacion-ai.git
cd conversacion-ai
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Cambios Recientes

### v1.3.0 - Mejoras en Agentes de IA y Navegación
- ✅ **Corrección crítica**: Solucionado error de `SelectItem` con valores vacíos que causaba fallos en la aplicación
- ✅ **Visualización mejorada**: Las conexiones WhatsApp ahora muestran su estatus (conectado/desconectado) con indicadores visuales
- ✅ **Unidades intuitivas**: Tiempo de retraso cambiado de milisegundos a segundos para mejor usabilidad
- ✅ **Navegación optimizada**: Después de crear un agente de IA, redirige automáticamente a `/asistente-ia`
- ✅ **Conversión automática**: Los formularios muestran segundos pero guardan milisegundos en la base de datos
- ✅ **Consistencia**: Aplicadas las mejoras tanto en creación como en edición de agentes

### v1.2.0 - Resolución de Página en Blanco
- ✅ **Corrección crítica**: Solucionado problema de página en blanco en `/crear-agente`
- ✅ **Manejo de estados**: Mejorado el manejo de estados de carga cuando no hay usuario autenticado
- ✅ **CRUD completo**: Verificado y confirmado funcionamiento completo de operaciones CRUD para agentes de IA

### v1.1.0 - Actualización de Logo
- ✅ Actualizado el logo de la aplicación de `kanban-pro-logo.png` a `logo2.png`
- ✅ Aplicado el nuevo logo en la pantalla de login
- ✅ Aplicado el nuevo logo en el menú lateral (sidebar)
- ✅ Mejorada la consistencia visual de la marca

## Estructura del Proyecto
