-- AlterTable
ALTER TABLE "usuarios_sistema" ADD COLUMN     "areas_permitidas" TEXT[] DEFAULT ARRAY[]::TEXT[];
