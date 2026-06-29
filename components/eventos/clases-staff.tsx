"use client"

import { Users, GraduationCap, CalendarDays } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalVeranoTab } from "@/components/eventos/personal-verano-tab"
import { ClasesVeranoTab } from "@/components/eventos/clases-verano-tab"
import { HorarioVeranoTab } from "@/components/eventos/horario-verano-tab"
import type {
  PersonalVeranoListado,
  ClaseVeranoListado,
  HorarioVeranoListado,
} from "@/lib/data/verano-clases"

export function ClasesStaff({
  personal,
  clases,
  maestros,
  horario,
}: {
  personal: PersonalVeranoListado[]
  clases: ClaseVeranoListado[]
  maestros: { id: number; nombre: string }[]
  horario: HorarioVeranoListado[]
}) {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList>
        <TabsTrigger value="personal" className="gap-1.5">
          <Users className="size-4" />
          Personal
        </TabsTrigger>
        <TabsTrigger value="clases" className="gap-1.5">
          <GraduationCap className="size-4" />
          Clases
        </TabsTrigger>
        <TabsTrigger value="horario" className="gap-1.5">
          <CalendarDays className="size-4" />
          Horario
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="mt-4">
        <PersonalVeranoTab personal={personal} />
      </TabsContent>
      <TabsContent value="clases" className="mt-4">
        <ClasesVeranoTab clases={clases} maestros={maestros} />
      </TabsContent>
      <TabsContent value="horario" className="mt-4">
        <HorarioVeranoTab horario={horario} clases={clases} />
      </TabsContent>
    </Tabs>
  )
}
