# SFFSyC — Sistema de la Subdirección de Fortalecimiento Familiar, Social y Comunitario

Plataforma administrativa interna del **DIF Municipal de Chihuahua**. Centraliza
y estandariza la información de centros comunitarios, beneficiarios, clases y
coordinación, reemplazando el manejo disperso en archivos de Excel.

> La plataforma está organizada por **áreas**. La primera es **Centros
> Comunitarios**; con el tiempo se sumarán otras áreas que conviven en el mismo
> sistema sin mezclarse.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (estricto) |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 6 |
| Autenticación | NextAuth.js v5 (credenciales + bcrypt) |
| UI | shadcn/ui + Tailwind CSS 3 |
| Excel | ExcelJS |

No depende de servicios externos (sin Supabase, sin auth en la nube): corre
completo en una máquina o servidor interno.

---

## Requisitos previos

- **Node.js 18 o superior** (probado con Node 22).
- **PostgreSQL 16** instalado y en ejecución.
- **Git** (para clonar el repositorio).

---

## Instalación paso a paso

### 1. Obtener el código e instalar dependencias

```bash
git clone <url-del-repositorio> sffsyc
cd sffsyc
npm install
```

### 2. Crear la base de datos y el usuario en PostgreSQL

Con `psql` (ajusta la contraseña a una segura para tu entorno):

```sql
CREATE ROLE dif_app LOGIN PASSWORD 'una_contraseña_segura' CREATEDB;
CREATE DATABASE sistema_dif OWNER dif_app;
```

> El permiso `CREATEDB` lo necesita Prisma para su base de datos "sombra"
> durante las migraciones en desarrollo. En producción puede retirarse.

### 3. Configurar las variables de entorno

Copia el ejemplo y edítalo:

```bash
cp .env.example .env
```

Contenido mínimo de `.env`:

```env
DATABASE_URL="postgresql://dif_app:una_contraseña_segura@localhost:5432/sistema_dif?schema=public"
AUTH_SECRET="<genera-uno-con: npx auth secret>"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_NOMBRE_SISTEMA="SFFSyC"
NEXT_PUBLIC_NOMBRE_DEPENDENCIA="Subdirección de Fortalecimiento Familiar, Social y Comunitario"
```

- `AUTH_SECRET`: genera uno con `npx auth secret` (o `openssl rand -base64 32`).
- `AUTH_URL`: en local `http://localhost:3000`; en el servidor, su URL/dominio.

### 4. Crear las tablas y los datos iniciales

```bash
npx prisma migrate deploy   # aplica las migraciones (producción)
npm run db:seed             # inserta zonas, categorías y el admin inicial
```

> En un entorno de desarrollo puedes usar `npm run db:migrate` (que es
> `prisma migrate dev`) en lugar de `migrate deploy`.

### 5. Compilar y arrancar

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm run build
npm run start
```

La aplicación queda disponible en `http://localhost:3000`.

---

## Acceso inicial

El seed crea un usuario administrador:

| Correo | Contraseña |
|---|---|
| `admin@dif.chihuahua.gob.mx` | `Admin2024!` |

> **Cambia esta contraseña** después del primer ingreso (Administración →
> Usuarios → Restablecer contraseña) y crea las cuentas del personal.

---

## Roles y permisos

| Rol | Qué ve | Qué edita |
|---|---|---|
| **Administrador** | Todo | Todo, incluidos usuarios y catálogos |
| **Coordinación general** | Todos los centros y zonas | Centros, beneficiarios, inscripciones, catálogos |
| **Coordinadora de zona** | Solo su zona | Centros y beneficiarios de su zona |
| **Oficina** | Todo (lectura) | Beneficiarios e inscripciones |

El filtrado por zona es automático: la coordinadora de zona solo ve y edita lo
que corresponde a su zona, sin acciones manuales.

---

## Mapa de rutas

```
/login                          Acceso al sistema
/dashboard                      Inicio: métricas y accesos rápidos

# Área: Centros Comunitarios
/centros                        Lista de centros (tarjetas + filtros)
/centros/nuevo                  Alta de centro
/centros/[id]                   Ficha del centro (clases, beneficiarios)
/centros/[id]/editar            Edición de centro
/centros/[id]/clases/nueva      Asignar clase con horarios
/beneficiarios                  Lista de beneficiarios
/beneficiarios/nuevo            Alta (con búsqueda de duplicados)
/beneficiarios/[id]             Ficha + inscripciones
/beneficiarios/[id]/editar      Edición
/catalogos                      Coordinadoras, clases, profesores
/datos                          Importar / Exportar Excel

# Administración (solo admin)
/admin/usuarios                 Cuentas del sistema
/admin/zonas                    Consulta de las 4 zonas
```

---

## Scripts disponibles

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción (requiere build) |
| `npm run lint` | Revisión de código (ESLint) |
| `npm run db:migrate` | Migraciones en desarrollo |
| `npm run db:seed` | Datos iniciales |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run db:reset` | Reinicia la base de datos (¡borra todo!) |

---

## Importar / Exportar Excel

En **Centros Comunitarios → Importar / Exportar** (admin y coordinación general):

- **Descarga plantillas** por entidad, con el formato y los valores válidos.
- **Importa** archivos `.xlsx`: el sistema previsualiza, valida fila por fila,
  detecta duplicados y solo inserta lo correcto al confirmar.
- **Exporta** los datos actuales con ese mismo formato.

Orden recomendado de carga: Coordinadoras → Clases → Profesores → Centros →
Beneficiarios → Inscripciones.

---

## Estrategia de despliegue

1. **Local** (actual): en la máquina del desarrollador.
2. **Servidor interno del DIF**: misma base de código; solo cambian las
   variables de `.env` (DATABASE_URL, AUTH_URL, AUTH_SECRET).
3. **Dominio institucional**: igual que el punto 2, ajustando `AUTH_URL`.

El mismo código funciona en los tres ambientes sin modificaciones.

---

## Documentación adicional

- [`docs/BITACORA-PROCESO.md`](docs/BITACORA-PROCESO.md) — bitácora del desarrollo
  y decisiones técnicas.
