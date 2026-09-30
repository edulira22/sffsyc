"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Map as MapIcon,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  CONFIRMADOS_SIN_NOMBRE,
  PLANO_INFORME,
  POR_REVISAR,
  dondeVa,
  labelAsistencia,
  normalizarBusqueda,
  type BloqueAcomodo,
  type InvitadoAcomodo,
} from "@/lib/eventos/informe-acomodo"

// Réplica de la app del staff del proyecto de layout (paginas/app_staff.html)
// con el diseño de la plataforma. Solo lectura. La navegación usa el hash de
// la URL (#A2, #tejedoras) para que el botón "atrás" del celular funcione y
// cualquier bloque se pueda compartir con un enlace directo.

type Vista =
  | { tipo: "inicio" }
  | { tipo: "bloque"; id: string }
  | { tipo: "grupo"; id: "tejedoras" | "por-revisar" }

const MAX_RESULTADOS = 60

// Colores del plano, alineados con la identidad de la plataforma.
const C = {
  bloque: "#1A3A6B", // gobierno
  bloqueApagado: "#D3D9E0",
  templete: "#2E8B7A", // agua
  marco: "#D8DEE4",
  etiqueta: "#0F172A",
  etiquetaSuave: "#64748B",
  halo: "#FFFFFF",
}

function vistaDeHash(bloques: BloqueAcomodo[]): Vista {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ""))
  if (h === "tejedoras" || h === "por-revisar") return { tipo: "grupo", id: h }
  if (h && bloques.some((b) => b.id === h)) return { tipo: "bloque", id: h }
  return { tipo: "inicio" }
}

function hashDe(v: Vista): string {
  return v.tipo === "inicio" ? "" : `#${encodeURIComponent(v.id)}`
}

export function StaffAcomodo({
  bloques,
  invitados,
  titulo,
  subtitulo,
}: {
  bloques: BloqueAcomodo[]
  invitados: InvitadoAcomodo[]
  titulo: string
  subtitulo: string
}) {
  const [vista, setVista] = useState<Vista>({ tipo: "inicio" })
  const [q, setQ] = useState("")
  // Cuántas entradas agregamos al historial: "Volver" retrocede si hay dónde.
  const profundidad = useRef(0)

  // Texto de búsqueda precalculado (nombre + cargo + grupo, sin acentos).
  const indice = useMemo(
    () =>
      invitados.map((p) => ({
        p,
        n: normalizarBusqueda(`${p.nombre} ${p.cargo} ${p.grupo}`),
      })),
    [invitados]
  )

  useEffect(() => {
    const leer = () => setVista(vistaDeHash(bloques))
    leer()
    window.addEventListener("popstate", leer)
    return () => window.removeEventListener("popstate", leer)
  }, [bloques])

  function ir(v: Vista) {
    const url = window.location.pathname + window.location.search + hashDe(v)
    window.history.pushState(window.history.state, "", url)
    profundidad.current += 1
    setVista(v)
    window.scrollTo({ top: 0 })
  }

  function volver() {
    if (profundidad.current > 0) {
      profundidad.current -= 1
      window.history.back()
    } else {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      )
      setVista({ tipo: "inicio" })
    }
  }

  function buscar(texto: string) {
    setQ(texto)
    // Escribir siempre lleva a los resultados, aunque se esté viendo un bloque.
    if (vista.tipo !== "inicio") {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      )
      setVista({ tipo: "inicio" })
    }
  }

  // --- Búsqueda: encuentra a todos; confirmados primero ---
  const termino = normalizarBusqueda(q).trim()
  const buscando = vista.tipo === "inicio" && termino.length >= 2
  const resultados = useMemo(() => {
    if (!buscando) return { lista: [] as InvitadoAcomodo[], total: 0 }
    const palabras = termino.split(/\s+/)
    const todos = indice
      .filter((x) => palabras.every((w) => x.n.includes(w)))
      .map((x) => x.p)
      .sort(
        (a, b) =>
          Number(a.asistencia !== "confirmado") -
            Number(b.asistencia !== "confirmado") ||
          a.nombre.localeCompare(b.nombre, "es")
      )
    return { lista: todos.slice(0, MAX_RESULTADOS), total: todos.length }
  }, [buscando, termino, indice])

  const bloquesResaltados = useMemo(
    () =>
      Array.from(
        new Set(
          resultados.lista
            .filter((p) => p.asistencia === "confirmado")
            .flatMap((p) => p.bloques)
        )
      ),
    [resultados]
  )

  return (
    <div className="min-h-screen bg-superficie">
      {/* Franja institucional */}
      <header className="bg-gobierno">
        <div className="mx-auto max-w-2xl px-4 py-3.5 sm:px-6">
          <p className="text-[13px] font-semibold tracking-tight text-white">
            {titulo}
          </p>
          <p className="text-[11px] text-white/60">{subtitulo}</p>
        </div>
      </header>

      {/* Buscador fijo */}
      <div className="sticky top-0 z-20 border-b border-border bg-superficie/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Buscar invitado por nombre, cargo o grupo…"
              aria-label="Buscar invitado"
              autoComplete="off"
              className="h-12 w-full rounded-xl border-[1.5px] border-border bg-white pl-11 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gobierno [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => buscar("")}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-12 pt-4 sm:px-6">
        {vista.tipo === "bloque" ? (
          <VistaBloque
            bloque={bloques.find((b) => b.id === vista.id)!}
            bloques={bloques}
            invitados={invitados}
            onVolver={volver}
          />
        ) : vista.tipo === "grupo" ? (
          <VistaGrupo
            id={vista.id}
            invitados={invitados}
            onVolver={volver}
          />
        ) : buscando ? (
          <Resultados
            bloques={bloques}
            resaltados={bloquesResaltados}
            lista={resultados.lista}
            total={resultados.total}
            onIr={ir}
          />
        ) : (
          <Inicio bloques={bloques} onIr={ir} />
        )}
      </main>
    </div>
  )
}

// --- Plano -------------------------------------------------------------------

function Plano({
  bloques,
  activos,
}: {
  bloques: BloqueAcomodo[]
  activos?: string[]
}) {
  const on = new Set(activos ?? [])
  const hay = on.size > 0
  const { w, h, templete } = PLANO_INFORME

  return (
    <svg
      viewBox={`-1 -1 ${w + 2} ${h + 2}`}
      role="img"
      aria-label={
        hay
          ? `Plano del área del evento con el bloque ${Array.from(on).join(", ")} destacado`
          : "Plano del área del evento"
      }
      className="block h-auto w-full"
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={1}
        fill="none"
        stroke={C.marco}
        strokeWidth={0.4}
      />
      <path d={templete} fill={C.templete} opacity={hay ? 0.45 : 0.9} />
      {bloques.map((b) => {
        const activo = on.has(b.id)
        return (
          <g key={b.id}>
            <path d={b.d} fill={!hay || activo ? C.bloque : C.bloqueApagado} />
            <text
              x={b.x}
              y={b.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={activo ? 4.2 : 2.6}
              fontWeight={800}
              fill={activo ? C.etiqueta : C.etiquetaSuave}
              stroke={C.halo}
              strokeWidth={1}
              paintOrder="stroke"
            >
              {b.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// --- Inicio ------------------------------------------------------------------

function Inicio({
  bloques,
  onIr,
}: {
  bloques: BloqueAcomodo[]
  onIr: (v: Vista) => void
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-3 sm:p-4">
        <Plano bloques={bloques} />
        <p className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: C.templete }} />
            Templete
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: C.bloque }} />
            Sillas
          </span>
        </p>
      </div>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bloques
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          {bloques.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onIr({ tipo: "bloque", id: b.id })}
              className="rounded-xl border-[1.5px] border-border bg-white px-1 py-3 text-center transition-colors hover:border-gobierno/50 active:bg-gobierno/[0.04]"
            >
              <span className="block text-[17px] font-extrabold text-foreground">
                {b.id}
              </span>
              <span className="block text-xs text-muted-foreground">
                {b.lugares} lugares
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onIr({ tipo: "grupo", id: "tejedoras" })}
            className="rounded-xl border-[1.5px] border-agua/40 bg-agua/[0.05] px-1 py-3 text-center transition-colors hover:border-agua"
          >
            <span className="block text-[17px] font-extrabold text-agua-700">TEJ.</span>
            <span className="block text-xs text-muted-foreground">Tejedoras</span>
          </button>
          <button
            type="button"
            onClick={() => onIr({ tipo: "grupo", id: "por-revisar" })}
            className="rounded-xl border-[1.5px] border-amber-300 bg-amber-50 px-1 py-3 text-center transition-colors hover:border-amber-500"
          >
            <span className="block text-[17px] font-extrabold text-amber-700">?</span>
            <span className="block text-xs text-muted-foreground">Por revisar</span>
          </button>
        </div>
      </section>

      {/* Lugares confirmados sin nombre */}
      <div className="rounded-xl border border-border bg-white p-4 text-sm">
        <p className="font-medium text-foreground">
          También llegan lugares confirmados sin nombre
        </p>
        <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
          {CONFIRMADOS_SIN_NOMBRE.map((s) => (
            <li key={s.grupo}>
              <span className="font-semibold text-foreground">{s.lugares}</span>{" "}
              de {s.grupo} · {s.bloques.join(" · ")}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-muted-foreground">
          No aparecen en la búsqueda: acomódalos en el bloque que tenga lugar.
        </p>
      </div>

      {/* Documentos */}
      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documentos
        </h2>
        <a
          href="/informe/staff/guia"
          className="flex items-center justify-center gap-2 rounded-xl bg-gobierno px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gobierno/90"
        >
          <Download className="size-4" />
          Descargar guía del staff (PDF)
        </a>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Una hoja por bloque con el plano, los grupos y la lista de confirmados.
        </p>

        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {DOCUMENTOS.map((d) => {
            const Icono = d.tipo === "plano" ? MapIcon : FileText
            return (
              <a
                key={d.href}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/40"
              >
                <Icono className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{d.titulo}</span>
                  <span className="block text-xs text-muted-foreground">{d.detalle}</span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const DOCUMENTOS = [
  {
    tipo: "plano",
    titulo: "Layout del área del evento",
    detalle: "Visor 2D con capas y etiquetas",
    href: "/informe/planos/layout_area_evento.html",
  },
  {
    tipo: "plano",
    titulo: "Layout completo del recinto",
    detalle: "Visor 2D de todo el recinto",
    href: "/informe/planos/layout_completo.html",
  },
  {
    tipo: "plano",
    titulo: "Layout 3D",
    detalle: "Solo computadora · archivo pesado",
    href: "/informe/planos/layout_3d.html",
  },
  {
    tipo: "pdf",
    titulo: "Fichas por bloque",
    detalle: "PDF · una hoja por bloque con filas y asignación",
    href: "/informe/planos/fichas_bloques.pdf",
  },
  {
    tipo: "pdf",
    titulo: "Plano del área del evento",
    detalle: "PDF para montaje",
    href: "/informe/planos/area_evento.pdf",
  },
  {
    tipo: "pdf",
    titulo: "Instalación de sillas",
    detalle: "PDF para instaladores",
    href: "/informe/planos/instalacion_sillas.pdf",
  },
] as const

// --- Resultados --------------------------------------------------------------

function Resultados({
  bloques,
  resaltados,
  lista,
  total,
  onIr,
}: {
  bloques: BloqueAcomodo[]
  resaltados: string[]
  lista: InvitadoAcomodo[]
  total: number
  onIr: (v: Vista) => void
}) {
  if (lista.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center">
        <p className="font-medium text-foreground">Sin resultados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prueba con otra parte del nombre, el cargo o el grupo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {resaltados.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-3 sm:p-4">
          <Plano bloques={bloques} activos={resaltados} />
        </div>
      )}
      {lista.map((p) => (
        <TarjetaPersona key={p.id} p={p} onIr={onIr} />
      ))}
      {total > lista.length && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          Mostrando {lista.length} de {total}. Escribe más para acotar.
        </p>
      )}
    </div>
  )
}

function TarjetaPersona({
  p,
  onIr,
}: {
  p: InvitadoAcomodo
  onIr: (v: Vista) => void
}) {
  const confirmado = p.asistencia === "confirmado"
  const reales = p.bloques.filter((b) => b !== POR_REVISAR)

  // A dónde lleva el toque: su bloque, Tejedoras o Por revisar.
  let destino: Vista | null = null
  if (p.tejedora) destino = { tipo: "grupo", id: "tejedoras" }
  else if (p.bloques.length === 1 && p.bloques[0] === POR_REVISAR)
    destino = { tipo: "grupo", id: "por-revisar" }
  else if (reales.length === 1) destino = { tipo: "bloque", id: reales[0] }

  const contenido = (
    <>
      <div
        className={cn(
          "flex min-w-[58px] shrink-0 flex-col items-center justify-center rounded-lg px-1.5 py-2 text-center text-[15px] font-extrabold leading-tight text-white",
          !confirmado
            ? "bg-slate-400"
            : p.tejedora
              ? "bg-agua"
              : reales.length === 0
                ? "bg-amber-500"
                : "bg-gobierno"
        )}
      >
        {dondeVa(p)
          .split(" · ")
          .map((x) => (
            <span key={x} className={x.length > 6 ? "text-[10px] leading-snug" : ""}>
              {x === POR_REVISAR ? "Por revisar" : x}
            </span>
          ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug text-foreground">
          {p.titulo ? `${p.titulo} ` : ""}
          {p.nombre}
          {!confirmado && (
            <span className="ml-1.5 inline-block rounded-full bg-slate-200 px-2 py-0.5 align-middle text-[11px] font-semibold text-slate-600">
              {labelAsistencia(p.asistencia)}
            </span>
          )}
        </p>
        {p.cargo && (
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{p.cargo}</p>
        )}
        <p className="text-[13px] leading-snug text-muted-foreground">
          {p.grupo}
          {p.nota ? ` · ${p.nota}` : ""}
        </p>
      </div>
    </>
  )

  const clases = cn(
    "flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left",
    !confirmado && "opacity-55"
  )

  return destino ? (
    <button
      type="button"
      onClick={() => onIr(destino!)}
      className={cn(clases, "transition-colors hover:border-gobierno/40")}
    >
      {contenido}
    </button>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}

// --- Bloque ------------------------------------------------------------------

function VistaBloque({
  bloque: b,
  bloques,
  invitados,
  onVolver,
}: {
  bloque: BloqueAcomodo
  bloques: BloqueAcomodo[]
  invitados: InvitadoAcomodo[]
  onVolver: () => void
}) {
  const confirmados = invitados
    .filter((p) => p.asistencia === "confirmado" && p.bloques.includes(b.id))
    .sort((a, c) => a.nombre.localeCompare(c.nombre, "es"))
  const sinNombre = CONFIRMADOS_SIN_NOMBRE.filter((s) => s.bloques.includes(b.id))

  return (
    <div className="space-y-4">
      <BotonVolver onClick={onVolver} />

      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Bloque {b.id}
          </h1>
          <span className="rounded-full bg-gobierno/[0.08] px-2.5 py-0.5 text-xs font-semibold text-gobierno">
            {b.lugares} lugares
          </span>
        </div>

        <Plano bloques={bloques} activos={[b.id]} />

        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quiénes van aquí
            </p>
            <p className="mt-0.5 text-[15px] leading-snug text-foreground">
              {b.grupos || "Sin asignación registrada."}
            </p>
          </div>
          {b.nota && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-[13px] leading-relaxed text-foreground">
              {b.nota}
            </p>
          )}
          {b.filas.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              Sillas por fila, del templete hacia atrás:{" "}
              <span className="tabular-nums text-foreground">{b.filas.join(" · ")}</span>
            </p>
          )}
          {sinNombre.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              Además pueden llegar lugares confirmados sin nombre:{" "}
              {sinNombre
                .map((s) => `${s.grupo} (${s.lugares} en total, repartidos en ${s.bloques.join(" · ")})`)
                .join("; ")}
              .
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Confirmados ({confirmados.length})
        </h2>
        <ListaPersonas
          personas={confirmados}
          vacio="Sin confirmados con nombre en este bloque."
          detalle={(p) => p.cargo || p.grupo}
        />
      </section>
    </div>
  )
}

// --- Tejedoras / Por revisar -------------------------------------------------

function VistaGrupo({
  id,
  invitados,
  onVolver,
}: {
  id: "tejedoras" | "por-revisar"
  invitados: InvitadoAcomodo[]
  onVolver: () => void
}) {
  const esTejedoras = id === "tejedoras"
  const personas = invitados
    .filter(
      (p) =>
        p.asistencia === "confirmado" &&
        (esTejedoras ? p.tejedora : p.bloques.includes(POR_REVISAR))
    )
    .sort((a, c) => a.nombre.localeCompare(c.nombre, "es"))

  return (
    <div className="space-y-4">
      <BotonVolver onClick={onVolver} />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {esTejedoras ? "Tejedoras" : "Por revisar"}{" "}
          <span className="text-lg font-semibold text-muted-foreground">
            ({personas.length})
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {esTejedoras
            ? "Grupo de amigas de la Directora del DIF. Van aparte, sin bloque asignado."
            : "Confirmados cuyo grupo aún no tiene bloque asignado. Consulta con coordinación dónde acomodarlos."}
        </p>
      </div>

      <ListaPersonas
        personas={personas}
        vacio="Nadie en esta lista."
        detalle={(p) => [p.cargo, p.grupo].filter(Boolean).join(" · ")}
      />
    </div>
  )
}

// --- Piezas compartidas ------------------------------------------------------

function BotonVolver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-gobierno hover:underline"
    >
      <ArrowLeft className="size-4" />
      Todos los bloques
    </button>
  )
}

function ListaPersonas({
  personas,
  vacio,
  detalle,
}: {
  personas: InvitadoAcomodo[]
  vacio: string
  detalle: (p: InvitadoAcomodo) => string
}) {
  if (personas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        {vacio}
      </div>
    )
  }
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-white">
      {personas.map((p) => (
        <div key={p.id} className="px-4 py-2.5">
          <p className="font-semibold leading-snug text-foreground">
            {p.titulo ? `${p.titulo} ` : ""}
            {p.nombre}
          </p>
          <p className="text-[13px] leading-snug text-muted-foreground">{detalle(p)}</p>
        </div>
      ))}
    </div>
  )
}
