import { Link } from "react-router-dom";
import { MessageSquare, Users, Calendar, CreditCard, Zap, Shield, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Fit IA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Características
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Beneficios
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(142_71%_45%_/_0.15)_0%,_transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Potenciado por Inteligencia Artificial</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up leading-tight">
              Gestiona tu gimnasio
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                con WhatsApp e IA
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-1">
              Fit IA automatiza la gestión de membresías, reservas de clases y pagos. 
              Tu asistente virtual atiende a tus miembros 24/7 por WhatsApp.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
              <Link to="/auth?mode=register">
                <button className="btn-hero flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comenzar Ahora
                </button>
              </Link>
              <a href="#demo">
                <button className="btn-hero-outline">
                  Ver Demostración
                </button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 animate-fade-in-up stagger-3">
              {[
                { value: "500+", label: "Gimnasios Activos" },
                { value: "50K+", label: "Miembros Gestionados" },
                { value: "99.9%", label: "Uptime Garantizado" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Todo lo que necesitas para
              <span className="text-primary"> crecer</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Una plataforma completa que automatiza las tareas repetitivas y te permite enfocarte en lo que importa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Chat Inteligente",
                description: "IA conversacional que responde consultas, agenda clases y procesa pagos automáticamente vía WhatsApp.",
              },
              {
                icon: Users,
                title: "Gestión de Miembros",
                description: "Control completo de membresías, historial de pagos, asistencia y renovaciones automáticas.",
              },
              {
                icon: Calendar,
                title: "Reserva de Clases",
                description: "Sistema de booking con cupos limitados, lista de espera y recordatorios automáticos.",
              },
              {
                icon: CreditCard,
                title: "Control de Pagos",
                description: "Registro de pagos, recordatorios de vencimiento y reportes financieros detallados.",
              },
              {
                icon: Clock,
                title: "Automatización 24/7",
                description: "Tu asistente nunca duerme. Atiende consultas y gestiona reservas a cualquier hora.",
              },
              {
                icon: TrendingUp,
                title: "Analíticas en Tiempo Real",
                description: "Dashboard con métricas clave: retención, ingresos, clases más populares y más.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="card-fitness group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Transforma la experiencia de
                <span className="text-primary"> tus miembros</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Con Fit IA, tus miembros pueden consultar horarios, reservar clases y verificar 
                su membresía directamente desde WhatsApp, sin descargar apps adicionales.
              </p>
              
              <div className="space-y-4">
                {[
                  "Respuestas instantáneas las 24 horas",
                  "Reservas y cancelaciones sin fricción",
                  "Recordatorios personalizados automáticos",
                  "Renovación de membresía en segundos",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Chat Interface */}
            <div className="relative">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">Fit IA</div>
                    <div className="text-sm text-muted-foreground">En línea</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="chat-bubble-outbound max-w-[80%]">
                      Hola, quiero reservar una clase de spinning para mañana
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="chat-bubble-inbound max-w-[80%]">
                      ¡Hola María! 🏋️ Tenemos clases de Spinning disponibles mañana:
                      <br /><br />
                      🕐 7:00 AM - 3 cupos<br />
                      🕐 6:00 PM - 1 cupo<br />
                      🕐 8:00 PM - 5 cupos<br /><br />
                      ¿Cuál prefieres?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="chat-bubble-outbound max-w-[80%]">
                      La de las 6 PM por favor
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="chat-bubble-inbound max-w-[80%]">
                      ✅ ¡Listo! Te reservé en Spinning mañana a las 6:00 PM con el instructor Carlos.
                      <br /><br />
                      Te enviaré un recordatorio 2 horas antes. ¡Nos vemos! 💪
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(142_71%_45%_/_0.1)_0%,_transparent_50%)]" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            ¿Listo para modernizar tu gimnasio?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Únete a cientos de gimnasios que ya automatizan su gestión con Fit IA. 
            Prueba gratis por 14 días, sin tarjeta de crédito.
          </p>
          
          <Link to="/auth?mode=register">
            <button className="btn-hero animate-pulse-glow">
              Comenzar Prueba Gratis
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Fit IA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Fit IA. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Términos
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
