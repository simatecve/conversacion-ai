# KanbanPRO

Aplicación de gestión de leads y conversaciones con integración de WhatsApp e IA.

## Características

- 🔐 Autenticación segura con Supabase
- 📱 Conexiones WhatsApp
- 💬 Gestión de conversaciones
- 👥 Administración de leads y contactos
- 📋 Sistema Kanban para gestión de leads
- 🤖 Asistente de IA
- 🔗 Gestión de integraciones de APIs de IA
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

## Sistema de Integraciones de IA

La aplicación incluye un sistema completo de gestión de integraciones con APIs de IA que permite:

### Funcionalidades
- **Gestión de claves API**: Almacenamiento seguro de claves para diferentes proveedores
- **Proveedores soportados**: OpenAI, Groq, Gemini, Claude
- **Activación/Desactivación**: Control granular de cada integración
- **Seguridad**: Las claves se almacenan de forma segura y se muestran enmascaradas
- **Validación**: Formularios con validación en tiempo real

### Acceso
1. Ve a **Configuración** en el menú lateral
2. Selecciona la pestaña **"Integraciones"**
3. Agrega, edita o elimina tus integraciones de IA

### Uso
- Haz clic en **"Agregar Integración"** para configurar una nueva API
- Selecciona el proveedor (OpenAI, Groq, Gemini, Claude)
- Ingresa tu clave API
- Activa/desactiva según necesites
- Usa los botones de edición para modificar integraciones existentes

## Sistema Kanban de Leads

La aplicación incluye un sistema completo de gestión de leads estilo Kanban que permite:

### Funcionalidades
- **Tablero Kanban**: Visualización de leads en columnas personalizables
- **Drag & Drop**: Arrastra y suelta leads entre diferentes columnas
- **Gestión de columnas**: Crear, editar y eliminar columnas (excepto la columna inicial)
- **Columna por defecto**: Cada usuario tiene automáticamente una columna "Nuevos Leads" que no se puede eliminar
- **Gestión completa de leads**: Crear leads con información detallada (nombre, email, teléfono, empresa, valor, notas)
- **Colores personalizables**: Asigna colores únicos a cada columna para mejor organización
- **Feedback visual**: Indicadores visuales durante el arrastre y notificaciones de éxito/error

### Acceso
1. Ve a **Leads** en el menú lateral
2. Visualiza tus leads organizados en columnas
3. Arrastra leads entre columnas para cambiar su estado
4. Usa los botones para agregar nuevas columnas o leads

### Uso
- **Crear columna**: Haz clic en "Agregar Columna" para crear una nueva etapa en tu proceso
- **Gestionar leads**: Agrega nuevos leads con toda su información de contacto y valor
- **Mover leads**: Simplemente arrastra y suelta para cambiar el estado de un lead
- **Personalizar**: Edita nombres y colores de columnas para adaptarlas a tu proceso de ventas

## Cambios Recientes

### v1.5.0 - Sistema Kanban de Leads
- ✅ **Nueva funcionalidad**: Sistema completo Kanban para gestión de leads
- ✅ **Drag & Drop**: Implementado con react-beautiful-dnd para mover leads entre columnas
- ✅ **Gestión de columnas**: CRUD completo para columnas con protección de columna inicial
- ✅ **Columna por defecto**: Cada usuario obtiene automáticamente una columna "Nuevos Leads"
- ✅ **Gestión de leads**: Formulario completo para crear leads con todos los campos necesarios
- ✅ **Colores personalizables**: Sistema de colores para identificar visualmente las columnas
- ✅ **Interfaz responsive**: Diseño adaptable con scroll horizontal para múltiples columnas
- ✅ **Feedback visual**: Indicadores durante el arrastre y notificaciones toast
- ✅ **Integración con base de datos**: Sincronización automática con Supabase
- ✅ **Ruta protegida**: Acceso seguro a través de `/leads` con autenticación requerida

### v1.4.0 - Sistema de Integraciones de IA
- ✅ **Nueva funcionalidad**: Sistema completo de gestión de integraciones de APIs de IA
- ✅ **Interfaz con pestañas**: Reorganizada la página de configuración con pestañas para "Perfil" e "Integraciones"
- ✅ **CRUD completo**: Crear, leer, actualizar y eliminar integraciones de API
- ✅ **Proveedores soportados**: OpenAI, Groq, Gemini y Claude
- ✅ **Seguridad**: Claves API enmascaradas con opción de mostrar/ocultar
- ✅ **Estado de activación**: Switch para activar/desactivar integraciones
- ✅ **Validación**: Formularios con validación y manejo de errores
- ✅ **UI moderna**: Interfaz limpia usando shadcn/ui components
- ✅ **Feedback visual**: Toasts para confirmaciones y notificaciones

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
