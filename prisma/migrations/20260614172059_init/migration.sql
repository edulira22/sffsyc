-- CreateEnum
CREATE TYPE "RolCoordinadora" AS ENUM ('general', 'zona', 'centro');

-- CreateEnum
CREATE TYPE "EstatusActivo" AS ENUM ('activa', 'inactiva');

-- CreateEnum
CREATE TYPE "TipoCentro" AS ENUM ('centro_comunitario', 'cedefam');

-- CreateEnum
CREATE TYPE "EstatusCentro" AS ENUM ('activo', 'inactivo', 'pendiente');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- CreateEnum
CREATE TYPE "Escolaridad" AS ENUM ('sin_escolaridad', 'preescolar', 'primaria', 'secundaria', 'preparatoria', 'universidad', 'otro');

-- CreateEnum
CREATE TYPE "EstatusBeneficiario" AS ENUM ('activo', 'inactivo', 'baja');

-- CreateEnum
CREATE TYPE "EstatusInscripcion" AS ENUM ('activa', 'baja', 'pendiente');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'coordinacion_general', 'coordinadora_zona', 'oficina');

-- CreateEnum
CREATE TYPE "EstatusUsuario" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "zonas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinadoras" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "telefono" TEXT,
    "rol" "RolCoordinadora" NOT NULL,
    "zona_id" INTEGER,
    "estatus" "EstatusActivo" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCentro" NOT NULL DEFAULT 'centro_comunitario',
    "zona_id" INTEGER NOT NULL,
    "coordinadora_id" INTEGER,
    "direccion" TEXT,
    "referencia_ubicacion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "horario_general" TEXT,
    "observaciones" TEXT,
    "estatus" "EstatusCentro" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "estatus" "EstatusActivo" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_clases" (
    "id" SERIAL NOT NULL,
    "nombre_oficial" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "descripcion" TEXT,
    "variantes_alias" TEXT,
    "estatus" "EstatusActivo" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "telefono" TEXT,
    "especialidad" TEXT,
    "observaciones" TEXT,
    "estatus" "EstatusActivo" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases_centro" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "clase_id" INTEGER NOT NULL,
    "profesor_id" INTEGER,
    "nivel_grupo" TEXT,
    "observaciones" TEXT,
    "estatus" "EstatusActivo" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clases_centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_clase" (
    "id" SERIAL NOT NULL,
    "clase_centro_id" INTEGER NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" SERIAL NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "nombres" TEXT NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "curp" TEXT,
    "telefono" TEXT,
    "domicilio" TEXT,
    "escolaridad" "Escolaridad",
    "grado_escolar" TEXT,
    "nombre_escuela" TEXT,
    "observaciones" TEXT,
    "estatus" "EstatusBeneficiario" NOT NULL DEFAULT 'activo',
    "fecha_primer_ingreso" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" SERIAL NOT NULL,
    "beneficiario_id" INTEGER NOT NULL,
    "clase_centro_id" INTEGER NOT NULL,
    "fecha_inscripcion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatus" "EstatusInscripcion" NOT NULL DEFAULT 'activa',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_sistema" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "zona_id" INTEGER,
    "estatus" "EstatusUsuario" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nombre_key" ON "zonas"("nombre");

-- CreateIndex
CREATE INDEX "coordinadoras_zona_id_idx" ON "coordinadoras"("zona_id");

-- CreateIndex
CREATE INDEX "coordinadoras_rol_idx" ON "coordinadoras"("rol");

-- CreateIndex
CREATE INDEX "centros_zona_id_idx" ON "centros"("zona_id");

-- CreateIndex
CREATE INDEX "centros_estatus_idx" ON "centros"("estatus");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_categorias_nombre_key" ON "catalogo_categorias"("nombre");

-- CreateIndex
CREATE INDEX "catalogo_clases_categoria_id_idx" ON "catalogo_clases"("categoria_id");

-- CreateIndex
CREATE INDEX "clases_centro_centro_id_idx" ON "clases_centro"("centro_id");

-- CreateIndex
CREATE INDEX "clases_centro_clase_id_idx" ON "clases_centro"("clase_id");

-- CreateIndex
CREATE INDEX "horarios_clase_clase_centro_id_idx" ON "horarios_clase"("clase_centro_id");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_curp_key" ON "beneficiarios"("curp");

-- CreateIndex
CREATE INDEX "beneficiarios_apellido_paterno_apellido_materno_nombres_idx" ON "beneficiarios"("apellido_paterno", "apellido_materno", "nombres");

-- CreateIndex
CREATE INDEX "beneficiarios_estatus_idx" ON "beneficiarios"("estatus");

-- CreateIndex
CREATE INDEX "inscripciones_beneficiario_id_idx" ON "inscripciones"("beneficiario_id");

-- CreateIndex
CREATE INDEX "inscripciones_clase_centro_id_idx" ON "inscripciones"("clase_centro_id");

-- CreateIndex
CREATE INDEX "inscripciones_estatus_idx" ON "inscripciones"("estatus");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_sistema_email_key" ON "usuarios_sistema"("email");

-- AddForeignKey
ALTER TABLE "coordinadoras" ADD CONSTRAINT "coordinadoras_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros" ADD CONSTRAINT "centros_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros" ADD CONSTRAINT "centros_coordinadora_id_fkey" FOREIGN KEY ("coordinadora_id") REFERENCES "coordinadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogo_clases" ADD CONSTRAINT "catalogo_clases_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "catalogo_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_centro" ADD CONSTRAINT "clases_centro_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_centro" ADD CONSTRAINT "clases_centro_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "catalogo_clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases_centro" ADD CONSTRAINT "clases_centro_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_clase" ADD CONSTRAINT "horarios_clase_clase_centro_id_fkey" FOREIGN KEY ("clase_centro_id") REFERENCES "clases_centro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_clase_centro_id_fkey" FOREIGN KEY ("clase_centro_id") REFERENCES "clases_centro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_sistema" ADD CONSTRAINT "usuarios_sistema_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
