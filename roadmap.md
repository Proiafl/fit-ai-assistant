# Roadmap - Fit AI Coach

Este documento detalla el progreso actual y los próximos pasos para el desarrollo del MVP de Fit AI Coach.

## 🟢 Etapa 1: UI & Estruttura (100% Completado)
- [x] **Diseño de Landing Page**: Estética premium con animaciones y modo oscuro.
- [x] **Dashboard Principal**: Layout con sidebar responsive y navegación por tabs.
- [x] **Módulos de UI**:
    - [x] Mensajería (Clon de WhatsApp).
    - [x] Gestión de Miembros.
    - [x] Planes de Membresía.
    - [x] Agenda de Clases (Calendario).
    - [x] Historial de Pagos.
    - [x] Configuración del Gimnasio.

## 🟡 Etapa 2: Infraestructura & Backend (70% Completado)
- [x] **Configuración de Supabase**: Base de datos PostgreSQL con tablas para miembros, planes, clases, registros, pagos, gimnasios, conversaciones y mensajes.
- [x] **Autenticación**: Login/Registro con Email, Google y GitHub funcionando.
- [x] **Sincronización de Datos (React Query)**:
    - [x] **Miembros**: Carga, filtrado y registro de nuevos miembros.
    - [x] **Membresías**: Conteo dinámico y creación de nuevos planes.
    - [x] **Pagos**: Registro de nuevos pagos y estadísticas en tiempo real.
    - [x] **Mensajería**: Historial de chats y envío de mensajes persistente.
    - [x] **Clases**: Sincronización completa con manejo de nulos para la agenda.
    - [x] **Configuración**: Persistencia total de datos del gimnasio y catálogo.
- [x] **Políticas de Seguridad (RLS)**: Configuración inicial de acceso por filas.

## 🟠 Etapa 3: Lógica de IA & WhatsApp (Próximo paso)
- [ ] **Integración de WhatsApp**:
    - [ ] Configuración de Webhook con Twilio o WhatsApp Business API.
    - [ ] Sincronización bidireccional de mensajes.
- [ ] **Motor de IA (Fit AI Assistant)**:
    - [ ] Integración con OpenAI (GPT-4o).
    - [ ] Lógica de reservas automáticas procesada por IA.
    - [ ] Análisis de sentimientos y reportes de retención de miembros.

## � Tareas Completadas Recientemente:
- [x] **Mutations de Miembros**: Formulario para registrar nuevos miembros directamente desde el Dashboard.
- [x] **Mutations de Planes**: Creación de membresías personalizadas con beneficios dinámicos.
- [x] **Fix de Calendario**: Soporte para clases sin horario (catálogo) sin romper la UI.
- [x] **Fix de Configuración**: Datos de gimnasio y horarios persistentes en Supabase.
