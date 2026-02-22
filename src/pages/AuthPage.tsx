import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("¡Bienvenido de nuevo!");
        navigate("/dashboard");
      } else {
        // === REGISTER ===
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { gym_name: formData.name },
          },
        });
        if (error) throw error;

        // Auto-create gym record
        if (signUpData.user) {
          await supabase.from("gyms").insert([{
            owner_id: signUpData.user.id,
            name: formData.name || "Mi Gimnasio",
            address: "",
            settings: {},
          }]);
        }

        // If Supabase returned a session immediately (email confirmation disabled),
        // navigate directly to dashboard. Otherwise, sign in with credentials.
        if (signUpData.session) {
          toast.success("¡Cuenta creada! Bienvenido a GymIApp 🎉");
          navigate("/dashboard");
        } else {
          // Email confirmation is enabled in Supabase — try signing in anyway
          // (for cases where Supabase config allows immediate login)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (!signInError && signInData.session) {
            toast.success("¡Cuenta creada! Bienvenido a GymIApp 🎉");
            navigate("/dashboard");
          } else {
            // Still needs email confirmation — show friendly one-time message
            toast.success("¡Cuenta creada! Revisa tu correo para activarla.", {
              duration: 8000,
              description: "Una vez confirmado, podrás acceder a tu dashboard.",
            });
          }
        }
      }
    } catch (error: any) {
      const msg: string = error.message || "";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        toast.error("Correo o contraseña incorrectos. Verifica tus datos.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Debes verificar tu correo antes de iniciar sesión.");
      } else if (msg.includes("User already registered") || msg.includes("already been registered")) {
        toast.error("Este correo ya está registrado. Inicia sesión.");
      } else if (msg.includes("Password should be at least")) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
      } else if (msg.includes("rate limit") || msg.includes("too many requests")) {
        toast.error("Demasiados intentos. Espera un momento e intenta de nuevo.");
      } else {
        toast.error(msg || "Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">GymIApp</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Ingresa tus credenciales para acceder a tu dashboard"
                : "Comienza a gestionar tu gimnasio con IA — gratis por 14 días"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del gimnasio</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Gym Fitness Pro"
                    className="pl-10 h-12 bg-secondary border-border"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                    autoComplete="organization"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@gimnasio.com"
                  className="pl-10 h-12 bg-secondary border-border"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete={isLogin ? "email" : "email"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-secondary border-border"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              )}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading
                ? "Procesando..."
                : isLogin
                  ? "Iniciar Sesión"
                  : "Crear cuenta y entrar"}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>

          {/* Switch mode */}
          <p className="text-center mt-8 text-muted-foreground">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Regístrate gratis" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>

      {/* Right side — Visual */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(142_71%_45%_/_0.2)_0%,_transparent_60%)]" />

        <div className="flex items-center justify-center w-full p-12 relative z-10">
          <div className="max-w-md text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Automatiza tu gimnasio con inteligencia artificial
            </h2>
            <p className="text-muted-foreground text-lg">
              Gestiona membresías, reservas y pagos mientras tu asistente virtual
              atiende a tus miembros por WhatsApp las 24 horas.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["WhatsApp", "IA Avanzada", "Pagos", "Reservas", "Reportes"].map((feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
