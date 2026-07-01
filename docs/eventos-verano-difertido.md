# Área de Eventos — Verano DIFertido 2026

## Descripción general

El área de **Eventos** agrupa módulos para cursos y actividades temporales del DIF Municipal de Chihuahua que no encajan en la estructura permanente de centros/clases. Actualmente contiene un único evento activo:

**Verano DIFertido 2026** — Curso de verano para niños, niñas y adolescentes (NNA). Se imparte en las instalaciones del DIF Municipal de Chihuahua del **20 de julio al 7 de agosto de 2026**. La temporada de inscripciones es del **29 de junio al 3 de julio de 2026** (lunes a viernes).

La fuente única de verdad del evento (fechas, grupos, tallas, documentos, reglamento) vive en [`lib/eventos/verano.ts`](../lib/eventos/verano.ts). Cualquier cambio de fechas o configuración se hace **solo ahí**.

---

## Equipos (grupos)

El curso se organiza en cinco equipos por rango de edad. Los NNA de 10–13 años se nivelan automáticamente entre TurboBots y Megatronix para tener el mismo número de integrantes.

| Equipo | Color | Edades | Salida |
|---|---|---|---|
| Botzitos | Amarillo `#EAB308` | 5–6 años | 1:30 pm |
| Robotines | Verde `#16A34A` | 7–8 años | 2:15 pm |
| Botix | Azul eléctrico `#2563EB` | 9 años | 2:15 pm |
| TurboBots | Naranja `#F97316` | 10 años | 2:15 pm |
| Megatronix | Morado / Plata `#7C3AED` | 11–12 años | 2:30 pm |

El equipo se **sugiere automáticamente** al capturar la fecha de nacimiento del NNA. El staff puede sobrescribirlo manualmente desde el expediente.

---

## Tallas de playera

Tres rangos disponibles:

- **Infantil:** 4, 6, 8, 10, 12, 14, 16
- **Teen (T-):** T-CH, T-M, T-G, T-XL
- **Adulto (A-):** A-CH, A-M

---

## Documentos requeridos

La documentación completa de un NNA comprende **14 requisitos**: 13 documentos físicos + el número de recibo de pago.

| # | Documento |
|---|---|
| 1 | Acta de nacimiento |
| 2 | CURP |
| 3 | 2 fotografías recientes, tamaño infantil a color |
| 4 | Certificado médico reciente |
| 5 | Cartilla de vacunación vigente |
| 6 | Comprobante de domicilio reciente |
| 7 | Servicio médico |
| 8 | INE de padres o tutores |
| 9 | INE de personas autorizadas para recoger (si aplica) |
| 10 | Reglamento |
| 11 | Carta de autorización para salir a cancha de futbol EFCEMAC |
| 12 | Carta de autorización de uso de imagen |
| 13 | Avisos de privacidad simplificado e integral |
| +1 | Número de recibo de pago |

En el expediente electrónico, el staff marca cada documento conforme lo recibe. Cuando los 14 están completos, la fila del NNA se resalta en **verde** en la lista y aparece un botón para abrir el expediente listo para imprimir.

---

## Flujos principales

### 1. Inscripción pública (`/verano`)

Página **sin login**, accesible desde cualquier dispositivo. La usan tanto las familias que se auto-registran como el personal de captura presencial.

**Flujo del capturador:**
1. Abrir `/verano` (se puede compartir como liga pública o QR).
2. Llenar el formulario con los datos del NNA, tutor y firma.
3. Al guardar, aparece en pantalla el **expediente completo** con un folio `VD26-XXXX` y un botón **Imprimir expediente**.
4. Se imprime el documento — sin necesidad de iniciar sesión ni abrir otra pestaña.
5. El botón **Inscribir a otro** limpia el formulario para la siguiente captura.

**Validaciones del formulario:**
- El NNA requiere nombre, fecha de nacimiento, talla y grupo.
- Se debe capturar al menos un padre/tutor (padre o madre, no ambos son obligatorios).
- Los teléfonos de casa y WhatsApp son obligatorios (10 dígitos).
- Se debe aceptar el reglamento para enviar.
- La CURP, al capturarse completa (18 caracteres), llena automáticamente la fecha de nacimiento.

**Normalización automática:**
- Nombres → formato Título (mayúscula inicial).
- Teléfonos → solo dígitos, máximo 10.
- Textos de salud → formato oración.

### 2. Lista de inscripciones (`/eventos/verano-difertido/inscripciones`)

Vista de staff (requiere sesión). Muestra todos los NNA inscritos con:

- **Búsqueda** por nombre o folio.
- **Filtros** por equipo, estatus de documentación y estatus general.
- **Ordenamiento** por cualquier columna.
- **Código de color:**
  - Verde: documentación 100% completa (13 docs + recibo).
  - Gris tachado: dado de baja.
  - Normal: activo con docs pendientes.

**Acciones por NNA (menú de tres puntos):**
- **Ver expediente** — abre el detalle.
- **Dar de baja** — cambia estatus a `baja`, pide motivo. El registro queda en gris/tachado y se puede reactivar.
- **Reactivar** — revierte una baja.
- **Eliminar** — borrado definitivo de la base de datos. Solo para errores de captura (pide confirmación destructiva).

### 3. Expediente individual (`/eventos/verano-difertido/inscripciones/[id]`)

Página de detalle de un NNA. Consta de dos partes:

**Panel de status de requisitos** (solo pantalla, no imprimible):
- Checkbox por cada uno de los 13 documentos.
- Campo para el número de recibo de pago.
- Se guarda automáticamente al marcar/desmarcar o al salir del campo del recibo.
- Al completar los 14 requisitos, aparece un botón verde para abrir la impresión.

**Documento del expediente** (imprimible):
- Réplica del formato físico rosa del DIF.
- Incluye: datos del NNA, padres/tutores, autorizados para recoger, datos de salud, recibo y firma.
- **No incluye** el reglamento (es demasiado largo para el expediente físico).
- **No incluye** el equipo asignado (es dato interno).
- El equipo del app-shell (barra lateral, encabezado) lleva `print:hidden`, así solo se imprime el documento.

**Acciones disponibles:**
- **Editar datos** — abre el formulario de edición (mismo componente que la inscripción, en modo `editar`). Permite corregir cualquier dato incluyendo el equipo.
- **Imprimir** — lanza el diálogo de impresión del navegador.

### 4. Impresión pública (`/imprimir-expediente/[id]`)

Ruta fuera del shell `(app)`, sin barra lateral. Requiere sesión. Se usa desde el botón "Abrir listo para imprimir" del panel de status cuando la documentación está completa. Abre en nueva pestaña y lanza el diálogo de impresión automáticamente.

### 5. Clases y staff (`/eventos/verano-difertido/clases`)

Módulo de configuración del curso. Tres pestañas:

**Personal:**
- Tipos: `maestro` (imparte clases) o `staff / apoyo`.
- Campos: nombre, tipo, rol/puesto, teléfono.
- La baja es lógica (estatus `inactivo`); si el maestro tiene clases asignadas, la relación queda en `null` (no se borra la clase).

**Clases:**
- Cada clase tiene: nombre, descripción opcional, y maestro asignado (opcional, solo de tipo `maestro`).
- Al eliminar una clase, sus bloques de horario se borran en cascada.

**Horario:**
- Se organiza como horario escolar: selecciona equipo, luego ve una tabla de días × horas.
- Para agregar un bloque: selecciona equipo, día, hora de inicio, hora de fin y clase.
- Los bloques aparecen visualmente en la grilla del equipo seleccionado.

---

## Tablero del evento (`/eventos/verano-difertido`)

Página de inicio del módulo. Muestra:

- **Cuenta regresiva** al inicio del curso (o al fin, si ya empezó).
- **Aviso de periodo de inscripciones** (aparece solo cuando está abierto; se oculta automáticamente).
- **Métricas globales:** total de niños inscritos activos, clases configuradas, staff y maestros.
- **Tarjetas por equipo:** para cada uno de los 5 equipos muestra:
  - **Activos** — NNA con estatus `activa` (independientemente de si tienen docs completos).
  - **Inscritos** — NNA activos con documentación 100% completa (13 docs + recibo).
- **Accesos rápidos:** formulario público, gestión de inscripciones, clases y staff.

---

## Estructura de archivos

```
lib/eventos/verano.ts              ← Fuente única de verdad (fechas, grupos, tallas, docs, reglamento)
lib/schemas/inscripcion-verano.ts  ← Validación Zod del formulario público
lib/schemas/verano-clases.ts       ← Validación Zod de clases/staff/horario
lib/data/verano.ts                 ← Consultas de lectura (inscripciones)
lib/data/verano-clases.ts          ← Consultas de lectura (clases, personal, horario)

app/verano/                        ← PÚBLICA (sin login)
  page.tsx                         ← Formulario de inscripción
  actions.ts                       ← Server Action: crearInscripcionVerano

app/(app)/eventos/verano-difertido/
  page.tsx                         ← Tablero del evento
  inscripciones/
    page.tsx                       ← Lista de inscripciones
    actions.ts                     ← actualizarStatus, darDeBaja, reactivar, eliminar, editar
    [id]/
      page.tsx                     ← Expediente individual + panel de docs
      editar/page.tsx              ← Edición de datos del NNA
  clases/
    page.tsx                       ← Clases y staff (pestañas)
    actions.ts                     ← CRUD de personal, clases y horario

app/imprimir-expediente/[id]/
  page.tsx                         ← Impresión en pestaña limpia (requiere sesión)

components/eventos/
  inscripcion-form.tsx             ← Formulario completo (crear y editar)
  expediente-verano.tsx            ← Documento imprimible del NNA
  status-documentos.tsx            ← Panel de checklist de requisitos
  inscripciones-tabla.tsx          ← Tabla con filtros, orden y acciones
  clases-staff.tsx                 ← Contenedor de pestañas (Tabs)
  personal-verano-tab.tsx          ← Pestaña de personal
  clases-verano-tab.tsx            ← Pestaña de clases
  horario-verano-tab.tsx           ← Pestaña de horario escolar
  cuenta-regresiva.tsx             ← Widget de countdown
  periodo-inscripcion.tsx          ← Aviso dinámico de temporada
  auto-imprimir.tsx                ← Lanza window.print() al cargar
  reglamento-dialog.tsx            ← Modal con el texto del reglamento
  boton-imprimir.tsx               ← Botón cliente para window.print()
```

---

## Tablas en base de datos

| Tabla | Modelo Prisma | Descripción |
|---|---|---|
| `inscripciones_verano` | `InscripcionVerano` | Un registro por NNA. Nunca se borra (estatus `activa` / `baja`), excepto la acción de Eliminar para errores de captura. |
| `personal_verano` | `PersonalVerano` | Maestros y staff del curso. Baja lógica (`inactivo`). |
| `clases_verano` | `ClaseVerano` | Clases o talleres. Al eliminar, borra sus horarios en cascada. |
| `horario_verano` | `HorarioVerano` | Bloques del horario escolar (grupo × día × hora × clase). |

### Campos clave de `inscripciones_verano`

| Campo | Tipo | Notas |
|---|---|---|
| `folio` | — | No se guarda. Se deriva del `id`: `VD26-${id.padStart(4,'0')}`. |
| `grupo` | `String?` | ID del equipo (`botzitos`…`megatronix`). Se sugiere por edad, se puede sobrescribir. |
| `documentos` | `Json` (`jsonb`) | Array de IDs de documentos entregados, p.ej. `["acta","curp","fotos"]`. |
| `recibo_pago` | `String?` | Número de recibo. Se captura después, en el expediente. |
| `estatus` | `String` | `"activa"` o `"baja"`. |
| `motivo_baja` | `String?` | Solo cuando `estatus = "baja"`. |
| `autorizados` | `Json` (`jsonb`) | Array de hasta 3 `{ nombre, celular, parentesco }`. |

---

## Reglas de negocio importantes

- **El folio no se guarda en BD.** Se deriva siempre del `id` con `folioVerano(id)` de `lib/eventos/verano.ts`.
- **La edad no se guarda.** Siempre se calcula desde `fechaNacimiento`.
- **El equipo es una sugerencia**, no una asignación definitiva. El staff puede corregirlo manualmente. El algoritmo de nivelación TurboBots/Megatronix (edades 10–13) se aplica sobre el padrón completo.
- **Dar de baja ≠ Eliminar.** La baja es reversible, conserva el historial y muestra el motivo. Eliminar es una acción destructiva solo para errores de captura.
- **"Inscritos" en el tablero** = activos con documentación 100% completa (13 docs + recibo). **"Activos"** = estatus `activa` independientemente de los docs.
- **La impresión del formulario público** (`/verano`) no requiere sesión: el expediente se renderiza en memoria desde el objeto recién guardado, sin consultar la BD por ID.
- La impresión desde el expediente administrativo (`/imprimir-expediente/[id]`) sí requiere sesión.
