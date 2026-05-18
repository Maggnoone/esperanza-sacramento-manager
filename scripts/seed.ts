/**
 * Database seed script for esperanza-sacramento-manager.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * This script truncates existing test tables and inserts realistic dummy data
 * so the UI can be exercised against a populated database.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

try {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) process.env[key] = val;
  }
} catch {
  /* .env not found, rely on existing env */
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function uuid() {
  return crypto.randomUUID();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSome<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDate(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t).toISOString().split("T")[0];
}

function yearsAgo(y: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  return d;
}

// ------------------------------------------------------------------
// Data
// ------------------------------------------------------------------
const nombres = [
  "Sofía",
  "Martina",
  "Catalina",
  "Emilia",
  "Valentina",
  "Julieta",
  "Morena",
  "Victoria",
  "Lucía",
  "María",
  "Josefina",
  "Renata",
  "Benjamín",
  "Bautista",
  "Mateo",
  "Lorenzo",
  "Juan",
  "Tomás",
  "Pedro",
  "Santiago",
  "Francisco",
  "Simón",
  "Felipe",
  "Agustín",
];

const apellidos = [
  "García",
  "Rodríguez",
  "Martínez",
  "López",
  "González",
  "Pérez",
  "Sánchez",
  "Romero",
  "Fernández",
  "Torres",
  "Ruiz",
  "Vázquez",
  "Ramírez",
  "Flores",
  "Benítez",
  "Acosta",
  "Medina",
  "Herrera",
];

function fullName(): string {
  return `${pick(nombres)} ${pick(apellidos)} ${pick(apellidos)}`;
}

function dni(): string {
  const n = Math.floor(20_000_000 + Math.random() * 25_000_000);
  return String(n);
}

function telefono(): string {
  const prefix = pick(["11", "221", "341", "351", "381", "0261"]);
  const num = String(Math.floor(Math.random() * 9_000_000 + 1_000_000));
  return `${prefix} ${num}`;
}

const direcciones = [
  "Av. Rivadavia 1234",
  "Calle Mitre 567",
  "Av. Corrientes 890",
  "Calle San Martín 432",
  "Av. Libertador 2500",
  "Calle Belgrano 99",
  "Av. 9 de Julio 1500",
  "Calle Alsina 321",
  "Av. Córdoba 780",
];

const parroquias = [
  "Parroquia San José",
  "Parroquia Nuestra Señora de Luján",
  "Parroquia Santa Teresa",
  "Parroquia San Juan Bautista",
  "Parroquia Cristo Rey",
  "Parroquia San Antonio de Padua",
];

const parentescos = ["tío/a", "padrino/madrina", "hermano/a", "primo/a", "amigo/a de la familia"];

const tiposCharla: Database["public"]["Enums"]["session_type"][] = [
  "charla",
  "convivencia",
  "retiro",
  "celebracion",
];

const metodosPago: Database["public"]["Enums"]["payment_method"][] = [
  "efectivo",
  "transferencia",
  "tarjeta",
];

const statuses: Database["public"]["Enums"]["confirmando_status"][] = [
  "activo",
  "apto",
  "confirmado",
  "baja",
];

const charlaTitulos = [
  "¿Quién es Jesús?",
  "El Camino de la Cruz",
  "Los Sacramentos de Iniciación",
  "La Eucaristía, fuente de vida",
  "La Comunidad Cristiana",
  "Retiro de Silencio",
  "Convivencia de Grado",
  "Celebración de Envío",
  "La oración personal",
  "Vida en el Espíritu",
];

const materialesTipos = ["PDF", "Video", "Audio", "Imagen", "Enlace"];

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log("\n⚠️  This will DELETE existing data in test tables.\n");
  console.log(
    "Tables affected: asistencia, materiales, pagos, confirmandos, charlas, padrinos, grupos, costo_retiro\n",
  );

  // We proceed automatically — CI-friendly. Add a prompt if you want manual confirmation.

  // 1. Delete in reverse FK order
  console.log("🧹 Truncating tables...");
  await supabase.from("asistencia").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("materiales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("pagos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("confirmandos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("charlas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("padrinos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("grupos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("costo_retiro").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✅ Tables cleared.\n");

  // 2. Grupos
  console.log("🌱 Seeding grupos...");
  const grupos = [
    {
      id: uuid(),
      nombre: "Confirmación 2025",
      anio: 2025,
      descripcion: "Grupo de confirmación del ciclo 2025",
    },
    {
      id: uuid(),
      nombre: "Confirmación 2026",
      anio: 2026,
      descripcion: "Grupo de confirmación del ciclo 2026",
    },
    {
      id: uuid(),
      nombre: "Catecumenado Jóvenes",
      anio: 2026,
      descripcion: "Grupo juvenil de preparación",
    },
  ];
  const { error: gErr } = await supabase.from("grupos").insert(grupos);
  if (gErr) throw gErr;
  console.log(`   → ${grupos.length} grupos`);

  // 3. Padrinos
  console.log("🌱 Seeding padrinos...");
  const padrinos = Array.from({ length: 8 }).map(() => ({
    id: uuid(),
    full_name: fullName(),
    dni: dni(),
    email: `padrino.${Math.random().toString(36).slice(2, 8)}@example.com`,
    telefono: telefono(),
    has_confirmation: Math.random() > 0.2,
    is_married_church: Math.random() > 0.3 ? Math.random() > 0.5 : null,
    parentesco: pick(parentescos),
    notas: Math.random() > 0.7 ? "Disponible fines de semana" : null,
  }));
  const { error: pErr } = await supabase.from("padrinos").insert(padrinos);
  if (pErr) throw pErr;
  console.log(`   → ${padrinos.length} padrinos`);

  // 4. Confirmandos
  console.log("🌱 Seeding confirmandos...");
  const confirmandos = Array.from({ length: 20 }).map(() => {
    const status = pick(statuses);
    const hasBaptism = status === "confirmado" || status === "apto" ? true : Math.random() > 0.15;
    const hasCommunion = hasBaptism && Math.random() > 0.1;
    return {
      id: uuid(),
      full_name: fullName(),
      dni: dni(),
      email: `confirmando.${Math.random().toString(36).slice(2, 8)}@example.com`,
      telefono: telefono(),
      direccion: pick(direcciones),
      fecha_nacimiento: randomDate(yearsAgo(18), yearsAgo(12)),
      has_baptism: hasBaptism,
      fecha_bautismo: hasBaptism ? randomDate(yearsAgo(15), yearsAgo(2)) : null,
      parroquia_bautismo: hasBaptism ? pick(parroquias) : null,
      has_communion: hasCommunion,
      fecha_comunion: hasCommunion ? randomDate(yearsAgo(10), yearsAgo(1)) : null,
      nombre_padre: Math.random() > 0.2 ? fullName() : null,
      nombre_madre: Math.random() > 0.2 ? fullName() : null,
      contacto_padres: Math.random() > 0.4 ? telefono() : null,
      notas: Math.random() > 0.7 ? "Requiere atención pastoral" : null,
      padrino_id: Math.random() > 0.5 ? pick(padrinos).id : null,
      group_id: pick(grupos).id,
      status,
      fecha_confirmacion:
        status === "confirmado" ? randomDate(new Date(2025, 3, 1), new Date(2025, 11, 31)) : null,
    };
  });
  const { error: cErr } = await supabase.from("confirmandos").insert(confirmandos);
  if (cErr) throw cErr;
  console.log(`   → ${confirmandos.length} confirmandos`);

  // 5. Charlas
  console.log("🌱 Seeding charlas...");
  const charlas = Array.from({ length: 10 }).map((_, i) => ({
    id: uuid(),
    titulo: charlaTitulos[i] || `Charla especial ${i + 1}`,
    descripcion: "Sesión formativa para confirmandos.",
    fecha: randomDate(new Date(2025, 0, 1), new Date(2026, 5, 30)),
    tipo: pick(tiposCharla),
    duracion_min: pick([45, 60, 90, 120]),
    ubicacion: pick(["Capilla principal", "Salón parroquial", "Aula 2", "Online"]),
    ponente: fullName(),
    group_id: pick(grupos).id,
  }));
  const { error: chErr } = await supabase.from("charlas").insert(charlas);
  if (chErr) throw chErr;
  console.log(`   → ${charlas.length} charlas`);

  // 6. Materiales
  console.log("🌱 Seeding materiales...");
  const materiales = charlas.flatMap((charla) =>
    Math.random() > 0.4
      ? [
          {
            id: uuid(),
            charla_id: charla.id,
            titulo: `Material de ${charla.titulo}`,
            descripcion: "Recurso de apoyo para la sesión.",
            tipo: pick(materialesTipos),
            url: "https://example.com/resource.pdf",
          },
        ]
      : [],
  );
  if (materiales.length) {
    const { error: mErr } = await supabase.from("materiales").insert(materiales);
    if (mErr) throw mErr;
    console.log(`   → ${materiales.length} materiales`);
  } else {
    console.log("   → 0 materiales");
  }

  // 7. Asistencia
  console.log("🌱 Seeding asistencia...");
  const asistencias = charlas.flatMap((charla) => {
    const confirmandosGrupo = confirmandos.filter((c) => c.group_id === charla.group_id);
    if (confirmandosGrupo.length === 0) return [];
    return confirmandosGrupo.map((c) => ({
      id: uuid(),
      charla_id: charla.id,
      confirmando_id: c.id,
      presente: Math.random() > 0.35,
      notas: Math.random() > 0.9 ? "Llegó tarde" : null,
    }));
  });
  if (asistencias.length) {
    // Insert in chunks to avoid request size limits
    const chunk = 500;
    for (let i = 0; i < asistencias.length; i += chunk) {
      const { error: aErr } = await supabase
        .from("asistencia")
        .insert(asistencias.slice(i, i + chunk));
      if (aErr) throw aErr;
    }
    console.log(`   → ${asistencias.length} registros de asistencia`);
  }

  // 8. Pagos
  console.log("🌱 Seeding pagos...");
  const pagos = confirmandos.flatMap((c) => {
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }).map(() => ({
      id: uuid(),
      confirmando_id: c.id,
      monto: pick([5000, 10000, 15000, 20000, 25000]),
      fecha: randomDate(new Date(2025, 0, 1), new Date(2026, 1, 28)),
      metodo: pick(metodosPago),
      referencia: Math.random() > 0.5 ? `REF-${Math.floor(Math.random() * 99999)}` : null,
      notas: Math.random() > 0.8 ? "Cuota mensual" : null,
      concepto: "retiro",
    }));
  });
  // Add some boleta payments for ~40% of confirmandos
  const boletaPagos = pickSome(confirmandos, 5, 10).map((c) => ({
    id: uuid(),
    confirmando_id: c.id,
    monto: pick([3000, 5000, 7000]),
    fecha: randomDate(new Date(2025, 3, 1), new Date(2026, 1, 28)),
    metodo: pick(metodosPago),
    referencia: `BOLETA-${Math.floor(Math.random() * 99999)}`,
    notas: "Boleta de confirmación",
    concepto: "boleta",
  }));
  const allPagos = [...pagos, ...boletaPagos];
  const { error: paErr } = await supabase.from("pagos").insert(allPagos);
  if (paErr) throw paErr;
  console.log(
    `   → ${allPagos.length} pagos (${pagos.length} retiro + ${boletaPagos.length} boleta)`,
  );

  // 9. Costo retiro
  console.log("🌱 Seeding costo_retiro...");
  const costoRetiro = [
    {
      id: uuid(),
      descripcion: "Retiro Espiritual 2025",
      monto: 45000,
      activo: true,
      concepto: "retiro",
    },
    {
      id: uuid(),
      descripcion: "Campamento Jóvenes 2026",
      monto: 60000,
      activo: false,
      concepto: "retiro",
    },
    {
      id: uuid(),
      descripcion: "Boleta de Confirmación",
      monto: 5000,
      activo: true,
      concepto: "boleta",
    },
  ];
  const { error: crErr } = await supabase.from("costo_retiro").insert(costoRetiro);
  if (crErr) throw crErr;
  console.log(`   → ${costoRetiro.length} costos`);

  console.log("\n🎉 Seed completed successfully!");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
