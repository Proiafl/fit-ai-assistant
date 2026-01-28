# Fit IA - Asistente de Gestión Inteligente para Gimnasios

Fit IA es una plataforma integral diseñada para modernizar y automatizar la gestión de gimnasios y centros de fitness. A través de la integración con **WhatsApp e Inteligencia Artificial**, permite a los dueños de gimnasios delegar tareas repetitivas y ofrecer una experiencia premium a sus miembros las 24 horas del día.

## 🚀 Características Principales

- **🤖 Asistente de WhatsApp con IA**: Atiende consultas, agenda clases y procesa pagos automáticamente sin intervención humana.
- **👥 Gestión de Miembros**: Panel de control completo para administrar altas, bajas, asistencias y perfiles de usuarios.
- **💳 Control de Membresías y Pagos**: Registro automatizado de planes, vencimientos y recordatorios de cobro.
- **📅 Sistema de Reservas**: Calendario inteligente para clases con gestión de cupos y listas de espera.
- **📊 Analíticas en Tiempo Real**: Dashboard con métricas clave como retención, ingresos y popularidad de clases.
- **💫 Experiencia "Sin Apps"**: Los miembros interactúan directamente desde WhatsApp, eliminando la fricción de descargar nuevas aplicaciones.

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con un stack moderno enfocado en el rendimiento y la experiencia de usuario:

- **Core**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/) (basado en Radix UI)
- **Gestión de Datos**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Visualización**: [Recharts](https://recharts.org/)
- **Animaciones**: Tailwind CSS Animate & Framer Motion concepts.

## 📦 Estructura del Proyecto

```text
src/
├── components/     # Componentes reutilizables y de dashboard
│   ├── dashboard/  # Pestañas y widgets específicos del panel
│   └── ui/         # Componentes base de shadcn/ui
├── hooks/          # Hooks personalizados
├── pages/          # Vistas principales (Landing, Auth, Dashboard)
└── lib/            # Utilidades y configuraciones
```

## 💻 Desarrollo Local

Para comenzar a trabajar en este proyecto localmente, sigue estos pasos:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Proiafl/fit-ai-assistant.git
   cd fit-ai-assistant
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Construir para producción**
   ```bash
   npm run build
   ```

---

*Proyecto desarrollado con ❤️ para revolucionar la industria del fitness.*
