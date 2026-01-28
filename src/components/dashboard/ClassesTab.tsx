import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Users, Clock, Loader2, Calendar, User, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const CLASS_GRADIENTS = [
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-rose-500 to-pink-600",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
  "bg-gradient-to-br from-orange-500 to-red-600",
];

const fetchClasses = async () => {
  const { data: rawClasses, error } = await supabase
    .from("classes")
    .select(`
      *,
      class_bookings (
        id
      )
    `);

  if (error) throw error;

  const uniqueNames = Array.from(new Set(rawClasses.map(c => c.name)));
  const nameToColor = Object.fromEntries(
    uniqueNames.map((name, i) => [name, CLASS_GRADIENTS[i % CLASS_GRADIENTS.length]])
  );

  return rawClasses.map(cls => ({
    ...cls,
    enrolled: cls.class_bookings?.length || 0,
    time: cls.time ? cls.time.substring(0, 5) : null,
    color: nameToColor[cls.name] || CLASS_GRADIENTS[0]
  }));
};

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hours = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

interface ClassDetails {
  id: string;
  name: string;
  instructor: string | null;
  capacity: number;
  enrolled: number;
  time: string | null;
  duration_minutes: number;
  color: string;
  days: number[] | null;
}

const ClassesTab = () => {
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    instructor: "",
    capacity: "20",
    duration_minutes: "60",
    time: "07:00",
    days: [] as number[]
  });

  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  // Mutations
  const saveClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        instructor: data.instructor,
        capacity: parseInt(data.capacity),
        duration_minutes: parseInt(data.duration_minutes),
        time: data.time + ":00",
        days: data.days
      };

      if (selectedClass?.id) {
        const { error } = await supabase.from("classes").update(payload).eq("id", selectedClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(selectedClass ? "Clase actualizada" : "Clase creada");
      setIsFormOpen(false);
      setSelectedClass(null);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Clase eliminada");
      setIsFormOpen(false);
      setIsDeleting(false);
      setSelectedClass(null);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const getClassesForSlot = (dayIndex: number, hour: string) => {
    return classes?.filter(
      (c) => c.days?.includes(dayIndex + 1) && c.time === hour
    ) || [];
  };

  const handleEdit = (cls: ClassDetails) => {
    setSelectedClass(cls);
    setClassForm({
      name: cls.name,
      instructor: cls.instructor || "",
      capacity: cls.capacity.toString(),
      duration_minutes: cls.duration_minutes.toString(),
      time: cls.time || "07:00",
      days: cls.days || []
    });
    setIsFormOpen(true);
  };

  const handleNewClass = () => {
    setSelectedClass(null);
    setClassForm({
      name: "",
      instructor: "",
      capacity: "20",
      duration_minutes: "60",
      time: "07:00",
      days: []
    });
    setIsFormOpen(true);
  };

  const toggleDay = (dayNum: number) => {
    setClassForm(prev => ({
      ...prev,
      days: prev.days.includes(dayNum)
        ? prev.days.filter(d => d !== dayNum)
        : [...prev.days, dayNum]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Cargando agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-fitness border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive font-semibold">Error al cargar la agenda</p>
        <p className="text-sm text-muted-foreground mt-2">{(error as any).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            const newDate = new Date(currentWeek);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentWeek(newDate);
          }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            {weekDates[0].toLocaleDateString("es-MX", { month: "long", day: "numeric" })} -{" "}
            {weekDates[6].toLocaleDateString("es-MX", { month: "long", day: "numeric", year: "numeric" })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => {
            const newDate = new Date(currentWeek);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentWeek(newDate);
          }}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button onClick={handleNewClass} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Clase
        </Button>
      </div>

      {/* Calendar */}
      <div className="card-fitness overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-4 text-center text-sm text-muted-foreground">Hora</div>
            {weekDates.map((date, i) => (
              <div key={i} className="p-4 text-center border-l border-border">
                <p className="font-medium">{days[i]}</p>
                <p className="text-2xl font-bold">{date.getDate()}</p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0">
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
                {hour}
              </div>
              {weekDates.map((_, dayIndex) => {
                const dayClasses = getClassesForSlot(dayIndex, hour);
                return (
                  <div
                    key={dayIndex}
                    className="p-2 border-l border-border min-h-[100px]"
                  >
                    {dayClasses.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`w-full ${cls.color} text-white rounded-lg p-2 text-left text-sm mb-1 hover:opacity-90 transition-opacity flex flex-col justify-between min-h-[85px] border border-white/10`}
                      >
                        <div>
                          <p className="font-bold truncate leading-tight text-base mb-1">{cls.name}</p>
                          <p className="text-[11px] opacity-90 flex items-center gap-1">
                            <User className="w-3 h-3" /> {cls.instructor || "Coach"}
                          </p>
                        </div>
                        <p className="text-[11px] font-medium bg-black/20 rounded px-1.5 py-0.5 w-fit mt-1">
                          {cls.enrolled}/{cls.capacity} cupos
                        </p>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Class Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setSelectedClass(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {selectedClass ? "Editar Clase" : "Crear Nueva Clase"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="className">Nombre de la Clase</Label>
              <Input
                id="className"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="Ej. CrossFit WOD"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={classForm.instructor}
                onChange={(e) => setClassForm({ ...classForm, instructor: e.target.value })}
                placeholder="Nombre del coach"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacidad Máxima</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={classForm.duration_minutes}
                  onChange={(e) => setClassForm({ ...classForm, duration_minutes: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Horario</Label>
              <Select
                value={classForm.time}
                onValueChange={(val) => setClassForm({ ...classForm, time: val })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecciona la hora" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {days.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${classForm.days.includes(i + 1)
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedClass && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleting(true)}
                className="w-full sm:w-auto mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Borrar
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button
                onClick={() => saveClassMutation.mutate(classForm)}
                disabled={saveClassMutation.isPending || !classForm.name || classForm.days.length === 0}
                className="flex-1 sm:flex-none"
              >
                {saveClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {selectedClass ? "Actualizar" : "Crear Clase"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              ¿Confirmar eliminación?
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            Esta acción eliminará permanentemente la clase de <strong>{selectedClass?.name}</strong>. Todos los miembros inscritos perderán su reserva.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDeleting(false)} className="flex-1">Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => selectedClass && deleteClassMutation.mutate(selectedClass.id)}
              className="flex-1"
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirmar Borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class details dialog */}
      <Dialog open={!!selectedClass && !isFormOpen} onOpenChange={(open) => { if (!open) setSelectedClass(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${selectedClass?.color}`} />
              {selectedClass?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card-fitness">
                <p className="text-sm text-muted-foreground mb-1">Instructor</p>
                <p className="font-semibold">{selectedClass?.instructor || "Coach"}</p>
              </div>
              <div className="card-fitness">
                <p className="text-sm text-muted-foreground mb-1">Duración</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedClass?.duration_minutes} min
                </p>
              </div>
            </div>
            <div className="card-fitness">
              <p className="text-sm text-muted-foreground mb-2">Ocupación</p>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{selectedClass?.enrolled} inscritos</span>
                    <span>{selectedClass?.capacity} capacidad</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${((selectedClass?.enrolled || 0) / (selectedClass?.capacity || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedClass(null)}
                className="flex-1 border border-border"
              >
                Cerrar
              </Button>
              <Button
                onClick={() => selectedClass && handleEdit(selectedClass)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Editar Clase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesTab;
