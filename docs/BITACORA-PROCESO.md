# Bitácora del proceso — SFFSyC

Documento de respaldo: qué se construyó, en qué orden y las decisiones técnicas
relevantes. Complementa al [`README.md`](../README.md) (que cubre la instalación).

---

## Resumen

Sistema administrativo para la Subdirección de Fortalecimiento Familiar, Social
y Comunitario del DIF Municipal de Chihuahua. Construido por fases, validando
cada una en el navegador y contra la base de datos antes de avanzar.

**Estado:** MVP funcional completo (Fases 1–9) + módulo de Importación/Exportación
de Excel + carga de datos reales (49 centros).

---

## Fases construidas

| Fase | Contenido | Estado |
|---|---|---|
| 1–2 | Inicialización del proyecto + esquema de base de datos (11 tablas) + seed | ✅ |
| 3 | Autenticación (NextAuth v5, login institucional, middleware por rol) | ✅ |
| 4 | Layout y navegación (sidebar por **áreas**, header, responsive) | ✅ |
| 5 | Catálogos: coordinadoras, clases, profesores | ✅ |
| 6 | Centros: lista, alta/edición, ficha, asignación de clases con horarios | ✅ |
| 7 | Beneficiarios: búsqueda de duplicados, registro, inscripciones | ✅ |
| 8 | Dashboard con métricas reales | ✅ |
| 9 | Administración de usuarios | ✅ |
| Extra | Importación / Exportación de Excel | ✅ |

---

## Decisiones técnicas relevantes

### Stack fijado a propósito
- **Prisma 6** (no 7): la v7 eliminó la forma clásica de configurar la conexión
  (`url = env(...)` en el esquema) y exige una configuración nueva con *driver
  adapters*. Se mantiene la v6 por flujo estándar y facilidad de mantenimiento.
- **shadcn/ui v2** (no v4): la versión nueva cambió de Radix UI a Base UI y a la
  sintaxis de Tailwind v4, incompatible con el Tailwind 3 de este proyecto.
- **Next.js 14** (no 15): para un stack idéntico al documentado y ampliamente
  soportado.

### Arquitectura por áreas
La navegación se diseñó como **plataforma → áreas → módulos**. "Centros
Comunitarios" es la primera área y agrupa Centros, Beneficiarios, Catálogos e
Importar/Exportar. Agregar una nueva área en el futuro es añadir un objeto a la
configuración de navegación (`lib/navegacion.ts`); su visibilidad podrá
restringirse por permisos de área del usuario sin tocar el resto del sistema.

### Patrones reutilizables
- **Mutaciones** vía Server Actions que **re-verifican el rol en el servidor**
  (nunca se confía solo en la interfaz).
- **Validación** con esquemas Zod compartidos entre cliente y servidor.
- Componentes comunes en `components/ui-patterns/` (encabezado de página, estado
  vacío, badge de estatus, barra de búsqueda/filtro, paginación, diálogo de
  confirmación).
- **Regla de oro:** nunca se elimina un registro; todo cambia de `estatus`.

### Reglas de negocio implementadas
- La **edad** del beneficiario nunca se captura: se calcula desde la fecha de
  nacimiento (con manejo UTC para no desfasar el día por zona horaria).
- La **coordinadora de zona** del centro no se captura: se infiere de la zona.
- Los **horarios** son estructurados (día + hora `HH:mm`), no texto libre.
- **Búsqueda de duplicados obligatoria** antes de registrar un beneficiario
  (por CURP y por nombre + fecha de nacimiento).

### Módulo de Excel
- Formato "ideal" diseñado desde cero (no adaptado a un Excel previo), con
  columnas en español y vocabularios controlados (`lib/excel/columnas.ts`).
- Las relaciones se expresan con datos legibles (zona, categoría, centro y clase
  por nombre; beneficiario por CURP); la importación los resuelve a llaves
  internas.
- La importación previsualiza, clasifica cada fila (nueva / duplicada / error
  con su motivo) y solo inserta lo correcto al confirmar; re-valida en el
  servidor.

### Ajuste por datos reales
Al cargar los 49 centros reales del DIF apareció un tipo de centro no previsto,
**STEM**. Se agregó al modelo (migración `agregar_tipo_stem`) para no perder
fidelidad. Es justo el tipo de retroalimentación que valida el esquema temprano.

---

## Carga de datos reales

- 49 centros + 46 coordinadoras (rol "centro"), distribuidos: Norte A 14,
  Norte B 12, Sur A 11, Sur B 12.
- Cargados con un script puntual y controlado (`scripts/importar-centros.ts`)
  por la ambigüedad al separar nombres completos en nombre/apellidos. El módulo
  de Excel queda para las cargas continuas del personal.

---

## Pendientes / notas para el uso real

1. **Cambiar la contraseña del admin** inicial y crear las cuentas del personal.
2. **Revisar 2–3 nombres de coordinadoras** con nombre compuesto de 3 palabras
   (ej. "Rita Cecilia Cepeda") que la separación automática dejó ligeramente
   mal divididos. Se corrigen en Catálogos → Coordinadoras → Editar.
3. **Limpiar datos de prueba** antes del uso formal: el centro "Centro
   Comunitario Riberas", la clase "Zumba", la beneficiaria "Sofia Hernandez" y
   el profesor "Ana Torres" se crearon durante las pruebas.
4. **Importar el resto de la información** (clases reales, profesores,
   beneficiarios, inscripciones) usando las plantillas de Excel.

---

## Fuera del MVP (etapas siguientes)

Identificadas pero no construidas: asistencia diaria, reportes con exportación
PDF, historial de auditoría (quién modificó qué), módulo CEDEFAM diferenciado,
oficios/correspondencia, inventario, personal, mantenimiento, notificaciones y
acceso para coordinadoras de centro.
