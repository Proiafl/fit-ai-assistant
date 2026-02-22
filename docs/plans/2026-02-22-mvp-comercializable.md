# Fit IA — Plan MVP Comercializable
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformar el prototipo funcional de Fit IA en un producto SaaS vendible de punta a punta, con pasarela de pagos, multi-tenancy real, agente de WhatsApp operativo, y landing page con conversión.

**Architecture:** SaaS multi-tenant con Supabase (Row-Level Security por `gym_id`), Edge Functions para el agente IA y webhook de WhatsApp, pasarela de pagos MercadoPago (LATAM) + Stripe (global), sistema de suscripciones con trial de 14 días.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui · Supabase (Auth, DB, Edge Functions, Storage) · OpenAI GPT-4o-mini · WhatsApp Business API (Twilio o Meta Cloud API directa) · MercadoPago / Stripe · React Router v6 · TanStack Query v5

---

## 📊 DIAGNÓSTICO ACTUAL DEL PROYECTO

### ✅ Lo que YA funciona
- Landing Page con diseño premium (dark mode, animaciones, secciones hero/features/benefits)
- Autenticación completa (email/password, Google, GitHub) con Supabase Auth
- Dashboard con 6 tabs (Mensajes, Miembros, Membresías, Clases, Pagos, Configuración)
- Todos los tabs conectados a Supabase con React Query (CRUD real)
- RLS básico configurado en Supabase
- UI de chat tipo WhatsApp (estructura visual)
- Configuración de gym persistente en BD

### ❌ Lo que FALTA para vender
1. **Multi-tenancy real**: No hay aislamiento por `gym_id` — todos ven todos los datos
2. **Agente IA de WhatsApp**: Solo visual, sin webhook ni integración real con OpenAI
3. **Pasarela de pagos**: Sin suscripciones, sin cobro, sin planes
4. **Sistema de trial/suscripción**: Sin control de acceso por plan
5. **Landing Page - Sección Precios**: Falta la sección `#pricing` (referenciada en nav pero no existe)
6. **Onboarding flow**: Registro no crea gym automáticamente
7. **Dashboard KPI real**: Sin métricas calculadas, sin gráficos reales
8. **Notificaciones automáticas**: Sin recordatorios de vencimiento
9. **Seguridad**: RLS incompleto, sin validación de suscripción activa
10. **Branding/SEO**: "lovable-tagger" en devDeps, sin meta tags, sin favicon custom

---

## 🎯 ESTRATEGIA DE MVP

### Modelo de Negocio
- **Free Trial**: 14 días gratis, acceso completo (sin tarjeta)
- **Plan Básico**: $29 USD/mes — hasta 100 miembros, agente WhatsApp básico
- **Plan Pro**: $59 USD/mes — miembros ilimitados, IA avanzada, analytics completos
- **Plan Premium**: $99 USD/mes — todo Pro + soporte prioritario + onboarding personalizado

### Mercado objetivo
- Dueños de gimnasios pequeños/medianos en LATAM (primario) y España
- Diferencial: "Sin apps" — todo por WhatsApp, sin fricción para los miembros

---

## 🗂️ TAREAS DE IMPLEMENTACIÓN

---

### Task 1: Multi-Tenancy — Aislamiento real por gimnasio

**Problema crítico**: Actualmente todos los usuarios ven todos los datos. Hay que asegurar que cada gimnasio solo vea los suyos.

**Files:**
- Modify: `src/lib/supabase.ts`
- Modify: `src/pages/AuthPage.tsx`
- SQL Migration: `supabase/migrations/001_multitenancy_rls.sql`

**Step 1: Aplicar migración SQL de RLS completo**

Ejecutar en Supabase SQL Editor:
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Agregar gym_id a auth.users via metadata
-- La relación: auth.users.id -> gyms.owner_id

-- Políticas para gyms
CREATE POLICY "Users can only see their own gym" ON gyms
  FOR ALL USING (owner_id = auth.uid());

-- Políticas para members (via gym)
CREATE POLICY "Gym members visible to gym owner" ON members
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

-- Repetir para membership_plans, classes, payments, conversations, messages
CREATE POLICY "Plans visible to gym owner" ON membership_plans
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Classes visible to gym owner" ON classes
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Payments visible to gym owner" ON payments
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Conversations visible to gym owner" ON conversations
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Messages visible to gym owner" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE gym_id IN (
        SELECT id FROM gyms WHERE owner_id = auth.uid()
      )
    )
  );
```

**Step 2: Verificar que `gyms` tiene columna `owner_id`**
```sql
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
UPDATE gyms SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;
```

**Step 3: Modificar onboarding para crear gym al registrarse**

En `src/pages/AuthPage.tsx`, después del `signUp` exitoso:
```typescript
// Crear gym automáticamente al registrarse
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await supabase.from('gyms').insert([{
    owner_id: user.id,
    name: formData.gymName || 'Mi Gimnasio',
    address: '',
    settings: {}
  }]);
}
```

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: multi-tenancy RLS - aislamiento completo por gym_id"
```

---

### Task 2: Sistema de Suscripciones y Plans

**Files:**
- Create: `src/pages/PricingPage.tsx`
- Create: `src/hooks/useSubscription.ts`
- Create: `src/components/SubscriptionGuard.tsx`
- SQL Migration: `supabase/migrations/002_subscriptions.sql`

**Step 1: Crear tabla de suscripciones**
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'trial' CHECK (plan_type IN ('trial', 'basic', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'past_due')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  mercadopago_subscription_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription visible to gym owner" ON subscriptions
  FOR ALL USING (
    gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
  );

-- Trigger: crear suscripción trial al crear gym
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (gym_id, plan_type, status)
  VALUES (NEW.id, 'trial', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_gym_created
  AFTER INSERT ON gyms
  FOR EACH ROW EXECUTE FUNCTION create_trial_subscription();
```

**Step 2: Crear hook `useSubscription.ts`**
```typescript
// src/hooks/useSubscription.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PlanType = 'trial' | 'basic' | 'pro' | 'premium';

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data: gym } = await supabase
        .from('gyms')
        .select('id')
        .single();
      
      if (!gym) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data;
    },
  });
}

export function isTrialExpired(subscription: any) {
  if (!subscription) return true;
  if (subscription.plan_type !== 'trial') return false;
  return new Date(subscription.trial_ends_at) < new Date();
}

export function hasFeature(subscription: any, feature: string): boolean {
  const planFeatures: Record<string, string[]> = {
    trial: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings'],
    basic: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings'],
    pro: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings', 'analytics', 'ai_agent'],
    premium: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings', 'analytics', 'ai_agent', 'priority_support'],
  };
  
  const plan = subscription?.plan_type || 'trial';
  return planFeatures[plan]?.includes(feature) ?? false;
}
```

**Step 3: Crear `SubscriptionGuard.tsx`**
```typescript
// src/components/SubscriptionGuard.tsx
import { useSubscription, isTrialExpired } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  showBanner?: boolean;
}

export function SubscriptionGuard({ children, showBanner = true }: SubscriptionGuardProps) {
  const { data: subscription } = useSubscription();

  if (isTrialExpired(subscription)) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Tu período de prueba terminó</h2>
          <p className="text-muted-foreground max-w-md">
            Activa tu suscripción para seguir gestionando tu gimnasio con Fit IA.
          </p>
        </div>
        <Link to="/pricing">
          <Button className="bg-primary text-primary-foreground">
            Ver Planes y Precios
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {showBanner && subscription?.plan_type === 'trial' && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-primary">
            🎉 Prueba gratuita — {Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))} días restantes
          </p>
          <Link to="/pricing">
            <Button size="sm" className="text-xs">Activar Plan</Button>
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
```

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: subscription system - trial 14 días + SubscriptionGuard"
```

---

### Task 3: Pasarela de Pagos — MercadoPago

**Files:**
- Create: `supabase/functions/create-checkout/index.ts`
- Create: `supabase/functions/mp-webhook/index.ts`
- Create: `src/pages/PricingPage.tsx`
- Modify: `src/App.tsx`

**Step 1: Edge Function `create-checkout`**
```typescript
// supabase/functions/create-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  const { data: { user } } = await supabase.auth.getUser(
    authHeader?.replace("Bearer ", "") || ""
  );

  if (!user) return new Response("Unauthorized", { status: 401 });

  const { planType } = await req.json();

  const PLANS: Record<string, { title: string; price: number; frequency: number }> = {
    basic: { title: "Fit IA Básico", price: 29, frequency: 1 },
    pro: { title: "Fit IA Pro", price: 59, frequency: 1 },
    premium: { title: "Fit IA Premium", price: 99, frequency: 1 },
  };

  const plan = PLANS[planType];
  if (!plan) return new Response("Invalid plan", { status: 400 });

  // Crear preferencia de pago en MercadoPago
  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{
        title: plan.title,
        quantity: 1,
        unit_price: plan.price,
        currency_id: "USD",
      }],
      payer: { email: user.email },
      back_urls: {
        success: `${Deno.env.get("APP_URL")}/dashboard?payment=success`,
        failure: `${Deno.env.get("APP_URL")}/pricing?payment=failed`,
        pending: `${Deno.env.get("APP_URL")}/pricing?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    }),
  });

  const preference = await mpResponse.json();
  
  return new Response(JSON.stringify({ 
    checkout_url: preference.init_point,
    preference_id: preference.id 
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 2: Edge Function `mp-webhook`**
```typescript
// supabase/functions/mp-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;

Deno.serve(async (req: Request) => {
  const body = await req.json();
  
  if (body.type !== "payment") {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verificar pago con MP
  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
    headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const payment = await paymentRes.json();

  if (payment.status !== "approved") {
    return new Response("Payment not approved", { status: 200 });
  }

  const { user_id, plan_type } = payment.metadata;

  // Obtener gym del usuario
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("owner_id", user_id)
    .single();

  if (!gym) return new Response("Gym not found", { status: 200 });

  // Actualizar suscripción
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase
    .from("subscriptions")
    .upsert({
      gym_id: gym.id,
      plan_type,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      mercadopago_subscription_id: payment.id.toString(),
    }, { onConflict: "gym_id" });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 3: Crear `PricingPage.tsx`**
```typescript
// src/pages/PricingPage.tsx
import { useState } from "react";
import { Check, Zap, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const plans = [
  {
    id: "basic",
    name: "Básico",
    price: 29,
    icon: Zap,
    color: "border-border",
    features: [
      "Hasta 100 miembros",
      "Chat WhatsApp manual",
      "Gestión de clases y pagos",
      "Reportes básicos",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 59,
    icon: Star,
    color: "border-primary ring-2 ring-primary/20",
    badge: "Más Popular",
    features: [
      "Miembros ilimitados",
      "Agente IA de WhatsApp 24/7",
      "Reservas automáticas por IA",
      "Analytics avanzados",
      "Recordatorios automáticos de pago",
      "Soporte prioritario",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 99,
    icon: Crown,
    color: "border-border",
    features: [
      "Todo lo de Pro",
      "Análisis de retención con IA",
      "Reportes personalizados",
      "Onboarding personalizado",
      "Soporte directo por WhatsApp",
      "Acceso anticipado a nuevas features",
    ],
  },
];

const PricingPage = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth?mode=register";
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planType: planId }),
      });

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch {
      toast.error("Error al procesar el pago. Intenta nuevamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Planes simples y <span className="text-primary">transparentes</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            14 días de prueba gratis en todos los planes. Sin tarjeta de crédito.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-2xl border p-8 flex flex-col ${plan.color}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <plan.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">${plan.price}</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
                className="w-full"
                variant={plan.badge ? "default" : "outline"}
              >
                {loading === plan.id ? "Procesando..." : "Empezar 14 días gratis"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
```

**Step 4: Agregar ruta en App.tsx**
```typescript
// Agregar en las rutas:
import PricingPage from "./pages/PricingPage";
// ...
<Route path="/pricing" element={<PricingPage />} />
```

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: payment gateway - MercadoPago checkout + subscriptions"
```

---

### Task 4: Agente de WhatsApp con IA (OpenAI + Twilio)

**Files:**
- Create: `supabase/functions/whatsapp-webhook/index.ts`
- Create: `supabase/functions/ai-agent/index.ts`
- Modify: `src/components/dashboard/SettingsTab.tsx`

**Step 1: Edge Function `whatsapp-webhook`**

Este es el endpoint que Twilio llama cuando llega un mensaje de WhatsApp:

```typescript
// supabase/functions/whatsapp-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Twilio envía formulario URL-encoded
  const text = await req.text();
  const params = new URLSearchParams(text);

  const from = params.get("From") || ""; // "whatsapp:+549..."
  const body = params.get("Body") || "";
  const gymPhone = params.get("To") || ""; // "whatsapp:+15..."

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const phone = from.replace("whatsapp:", "");

  // Buscar miembro por teléfono
  const { data: member } = await supabase
    .from("members")
    .select("*, gyms(id, settings)")
    .eq("phone", phone)
    .single();

  // Si no lo encontramos, el gimnasio debe estar registrado con ese número
  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("settings->whatsapp_number", gymPhone.replace("whatsapp:", ""))
    .single();

  if (!gym) {
    return new Response("<?xml version='1.0'?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Buscar o crear conversación
  let conversation;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("*")
    .eq("member_id", member?.id || null)
    .eq("gym_id", gym.id)
    .maybeSingle();

  if (existingConv) {
    conversation = existingConv;
  } else {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert([{
        gym_id: gym.id,
        member_id: member?.id || null,
        last_message: body,
        last_message_time: new Date().toISOString(),
      }])
      .select()
      .single();
    conversation = newConv;
  }

  // Guardar mensaje entrante
  await supabase.from("messages").insert([{
    conversation_id: conversation.id,
    content: body,
    sender_type: "user",
  }]);

  // Llamar al agente IA
  const aiResponse = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-agent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        message: body,
        gym_id: gym.id,
        member_id: member?.id,
        conversation_id: conversation.id,
        phone,
      }),
    }
  );

  const { reply } = await aiResponse.json();

  // Guardar respuesta del agente
  await supabase.from("messages").insert([{
    conversation_id: conversation.id,
    content: reply,
    sender_type: "ai",
  }]);

  // Actualizar última conversación
  await supabase
    .from("conversations")
    .update({ last_message: reply, last_message_time: new Date().toISOString() })
    .eq("id", conversation.id);

  // Responder via Twilio TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message to="${from}">${reply}</Message>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
});
```

**Step 2: Edge Function `ai-agent`**
```typescript
// supabase/functions/ai-agent/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req: Request) => {
  const { message, gym_id, member_id, conversation_id } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Contexto del gimnasio
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, address, settings")
    .eq("id", gym_id)
    .single();

  // Contexto del miembro (si existe)
  let memberContext = "El usuario no está registrado como miembro.";
  if (member_id) {
    const { data: member } = await supabase
      .from("members")
      .select("*, membership_plans(name)")
      .eq("id", member_id)
      .single();
    
    if (member) {
      memberContext = `Miembro: ${member.full_name}. Plan: ${member.membership_plans?.name || 'Sin plan'}. Estado: ${member.status}. Vencimiento: ${member.membership_end_date || 'No definido'}.`;
    }
  }

  // Clases disponibles
  const { data: classes } = await supabase
    .from("classes")
    .select("name, instructor, schedule, capacity, current_capacity")
    .eq("gym_id", gym_id)
    .limit(10);

  const classesContext = classes?.map(c => 
    `- ${c.name} con ${c.instructor}: ${c.schedule || 'Sin horario fijo'} (${c.current_capacity || 0}/${c.capacity || '∞'} cupos)`
  ).join("\n") || "No hay clases disponibles";

  // Historial de conversación (últimos 5 mensajes)
  const { data: history } = await supabase
    .from("messages")
    .select("content, sender_type")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const historyMessages = (history?.reverse() || []).map(m => ({
    role: m.sender_type === "user" ? "user" : "assistant",
    content: m.content,
  }));

  const systemPrompt = `Eres el asistente virtual del gimnasio "${gym?.name || 'Fit IA Gym'}".
Tu misión es ayudar a los miembros vía WhatsApp con:
- Consultar horarios y disponibilidad de clases
- Realizar y cancelar reservas
- Verificar estado de membresía y fechas de vencimiento
- Informar sobre planes y precios

Información del gimnasio:
- Nombre: ${gym?.name}
- Dirección: ${gym?.address || 'Consultar en recepción'}
- Horario: ${gym?.settings?.openingTime || '06:00'} - ${gym?.settings?.closingTime || '22:00'}

${memberContext}

Clases disponibles:
${classesContext}

Instrucciones:
- Responde siempre en español, de forma amigable y concisa
- Para reservar, confirma nombre de clase, horario y disponibilidad
- Si no puedes hacer algo, sugiere llamar al gimnasio
- Usa emojis con moderación (máximo 2 por mensaje)
- Respuestas cortas (máximo 150 palabras)`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Disculpa, no pude procesar tu mensaje. Por favor intenta nuevamente.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 3: Deploy Edge Functions**
```bash
# Requiere Supabase CLI instalado
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy ai-agent
supabase functions deploy create-checkout
supabase functions deploy mp-webhook --no-verify-jwt

# Configurar secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
supabase secrets set APP_URL=https://fit-ia.app
```

**Step 4: Configurar Twilio**
- Crear cuenta Twilio
- Activar WhatsApp Sandbox (para testing) o WhatsApp Business (para producción)
- En Twilio Console → Messaging → Settings → Webhook URL:
  `https://<PROJECT_ID>.supabase.co/functions/v1/whatsapp-webhook`
- En SettingsTab, agregar campo para número de WhatsApp del gimnasio

**Step 5: Commit**
```bash
git add -A
git commit -m "feat: whatsapp webhook + AI agent (OpenAI GPT-4o-mini)"
```

---

### Task 5: Landing Page — Sección de Precios + SEO

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Modify: `index.html`

**Step 1: Agregar sección `#pricing` a LandingPage**

La landing ya referencia `#pricing` en el nav pero la sección no existe. Agregar antes del footer:

```tsx
{/* Pricing Section */}
<section id="pricing" className="py-24">
  <div className="container mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold mb-4">
        Precios <span className="text-primary">simples</span>
      </h2>
      <p className="text-muted-foreground text-lg">
        14 días gratis en todos los planes. Sin tarjeta de crédito.
      </p>
    </div>
    {/* 3 pricing cards inline */}
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {/* Copiar la estructura de PricingPage aquí para coherencia */}
    </div>
  </div>
</section>
```

**Step 2: Actualizar `index.html` con meta tags SEO**
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fit IA — Asistente de WhatsApp con IA para Gimnasios</title>
  <meta name="description" content="Automatiza la gestión de tu gimnasio con inteligencia artificial. Tu asistente virtual atiende miembros, agenda clases y procesa pagos 24/7 por WhatsApp." />
  <meta property="og:title" content="Fit IA — Tu Gimnasio Inteligente" />
  <meta property="og:description" content="Automatiza membresías, reservas y pagos con IA y WhatsApp." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

**Step 3: Crear favicon SVG en `public/favicon.svg`**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#22c55e"/>
  <path d="M30 50 L45 35 L55 45 L70 30" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="65" r="10" fill="white"/>
</svg>
```

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: landing pricing section + SEO meta tags + favicon"
```

---

### Task 6: Dashboard — KPIs Reales + Onboarding

**Files:**
- Create: `src/components/dashboard/DashboardHome.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Create: `src/components/OnboardingModal.tsx`

**Step 1: Crear componente `DashboardHome.tsx` con métricas reales**

```typescript
// src/components/dashboard/DashboardHome.tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Users, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function DashboardHome() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const { data: gym } = await supabase.from("gyms").select("id").single();
      if (!gym) return null;

      const [members, payments, classes, activeMembers] = await Promise.all([
        supabase.from("members").select("id", { count: "exact" }).eq("gym_id", gym.id),
        supabase.from("payments").select("amount").eq("gym_id", gym.id).gte("payment_date", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("classes").select("id", { count: "exact" }).eq("gym_id", gym.id),
        supabase.from("members").select("id", { count: "exact" }).eq("gym_id", gym.id).eq("status", "active"),
      ]);

      const totalRevenue = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        totalMembers: members.count || 0,
        activeMembers: activeMembers.count || 0,
        monthlyRevenue: totalRevenue,
        totalClasses: classes.count || 0,
        retentionRate: members.count ? Math.round(((activeMembers.count || 0) / (members.count || 1)) * 100) : 0,
      };
    },
  });

  const kpis = [
    { label: "Miembros Totales", value: stats?.totalMembers || 0, icon: Users, color: "text-blue-400" },
    { label: "Miembros Activos", value: stats?.activeMembers || 0, icon: TrendingUp, color: "text-green-400" },
    { label: "Ingresos del Mes", value: `$${stats?.monthlyRevenue?.toLocaleString() || 0}`, icon: CreditCard, color: "text-purple-400" },
    { label: "Clases Registradas", value: stats?.totalClasses || 0, icon: Calendar, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card-fitness">
            <kpi.icon className={`w-6 h-6 ${kpi.color} mb-3`} />
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-sm text-muted-foreground">{kpi.label}</div>
          </div>
        ))}
      </div>
      <div className="card-fitness">
        <h3 className="font-semibold mb-4">Tasa de Retención</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-primary">{stats?.retentionRate || 0}%</div>
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${stats?.retentionRate || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Agregar tab "Inicio" al Dashboard**
```typescript
// En Dashboard.tsx, agregar a los tabs:
{ id: "home", label: "Inicio", icon: LayoutDashboard },
// Y en el contenido:
{activeTab === "home" && <DashboardHome />}
```

**Step 3: Crear `OnboardingModal.tsx`**
```typescript
// Mostrar solo si el gym no tiene datos (primer login)
// Pasos: 1) Nombre del gimnasio 2) Número WhatsApp 3) Agregar primer plan
```

**Step 4: Commit**
```bash
git add -A
git commit -m "feat: dashboard home with real KPIs + onboarding modal"
```

---

### Task 7: Seguridad y Limpieza Final

**Files:**
- Modify: `package.json`
- Modify: `src/components/dashboard/SettingsTab.tsx`
- Create: `src/pages/PrivacyPage.tsx`
- Create: `src/pages/TermsPage.tsx`

**Step 1: Remover lovable-tagger**
```bash
npm uninstall lovable-tagger
```

**Step 2: Validar suscripción en Dashboard**
```typescript
// En Dashboard.tsx wrappear el contenido con SubscriptionGuard
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
// ...
<SubscriptionGuard>
  {activeTab === "messages" && <MessagesTab />}
  ...
</SubscriptionGuard>
```

**Step 3: Agregar número de WhatsApp en Settings**

En `SettingsTab.tsx`, agregar campo para configurar el número de WhatsApp del gimnasio (el que se usa en Twilio):
```typescript
<div className="space-y-2">
  <Label htmlFor="whatsappNumber">Número de WhatsApp del Bot</Label>
  <Input
    id="whatsappNumber"
    placeholder="+5491112345678"
    value={config.whatsappNumber}
    onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
  />
  <p className="text-xs text-muted-foreground">
    Este es el número de WhatsApp Business configurado en Twilio
  </p>
</div>
```

**Step 4: Crear páginas legales básicas**

Páginas simples de Privacidad y Términos (requeridas para operar legalmente):
```typescript
// src/pages/PrivacyPage.tsx — Política de Privacidad básica
// src/pages/TermsPage.tsx — Términos y Condiciones básicos
```

**Step 5: Agregar rutas legales en App.tsx**
```typescript
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
```

**Step 6: Actualizar links del footer en LandingPage**
```typescript
// Cambiar href="#" por rutas reales:
<Link to="/privacy">Privacidad</Link>
<Link to="/terms">Términos</Link>
```

**Step 7: Commit final**
```bash
git add -A
git commit -m "feat: security hardening + legal pages + remove lovable-tagger"
git tag v1.0.0-mvp
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Variables de entorno requeridas en Supabase:
```
OPENAI_API_KEY=sk-proj-...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
APP_URL=https://tudominio.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### Variables de entorno en Vite (.env.production):
```
VITE_SUPABASE_URL=https://veassqgbyrupvxuyplur.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Pasos de deployment:
1. `npm run build` → subir `dist/` a Vercel/Netlify/Cloudflare Pages
2. Configurar dominio custom
3. Deploy Edge Functions con `supabase functions deploy`
4. Configurar Twilio webhook URL
5. Configurar MercadoPago webhook URL

---

## 📈 MÉTRICAS DE ÉXITO (Post-lanzamiento)

| KPI | Objetivo Mes 1 | Objetivo Mes 3 |
|-----|---|---|
| Registros trial | 50 | 200 |
| Conversión trial → pago | 20% | 30% |
| MRR | $290 | $3,540 |
| Churn mensual | <10% | <5% |
| NPS | >50 | >65 |

---

## 💰 ANÁLISIS FINANCIERO MVP

### CAC (Costo de Adquisición):
- Ads LATAM: ~$15 USD/lead → $75 USD/conversión (conv rate 20%)

### LTV (Lifetime Value):
- Plan promedio: $49/mes × 18 meses = $882 LTV
- LTV/CAC ratio: 11.7x (excelente para SaaS)

### Break-even:
- 10 clientes en Plan Pro ($59) → $590/mes
- Costo infraestructura: ~$50/mes (Supabase + Twilio + OpenAI)
- Margen: ~91%

---

## 🏁 ORDEN DE EJECUCIÓN RECOMENDADO

1. **Task 1** → Multi-tenancy (CRÍTICO, sin esto nada es seguro)
2. **Task 2** → Suscripciones (CRÍTICO, define el modelo de negocio)
3. **Task 5** → Landing + SEO (ALTA, para empezar a generar tráfico)
4. **Task 3** → Pasarela de pagos (ALTA, para monetizar)
5. **Task 6** → Dashboard KPIs (MEDIA, mejora retención)
6. **Task 4** → Agente WhatsApp IA (MEDIA, el core del producto)
7. **Task 7** → Seguridad + Limpieza (SIEMPRE ÚLTIMO, antes de lanzar)
