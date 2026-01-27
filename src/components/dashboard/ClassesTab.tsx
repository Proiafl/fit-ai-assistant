import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data for classes
const mockClasses = [
  {
    id: 1,
    name: "Spinning",
    instructor: "Carlos",
    capacity: 20,
    enrolled: 18,
    time: "07:00",
    duration: 45,
    color: "bg-primary",
    days: [1, 3, 5], // Mon, Wed, Fri
  },
  {
    id: 2,
    name: "Yoga",
    instructor: "Ana",
    capacity: 15,
    enrolled: 12,
    time: "08:00",
    duration: 60,
    color: "bg-violet-500",
    days: [2, 4], // Tue, Thu
  },
  {
    id: 3,
    name: "CrossFit",
    instructor: "Miguel",
    capacity: 12,
    enrolled: 12,
    time: "09:00",
    duration: 50,
    color: "bg-orange-500",
    days: [1, 2, 3, 4, 5],
  },
  {
    id: 4,
    name: "Zumba",
    instructor: "Laura",
    capacity: 25,
    enrolled: 20,
    time: "18:00",
    duration: 45,
    color: "bg-pink-500",
    days: [1, 3, 5],
  },
  {
    id: 5,
    name: "HIIT",
    instructor: "Roberto",
    capacity: 15,
    enrolled: 8,
    time: "19:00",
    duration: 30,
    color: "bg-red-500",
    days: [2, 4],
  },
  {
    id: 6,
    name: "Pilates",
    instructor: "Sofía",
    capacity: 12,
    enrolled: 10,
    time: "10:00",
    duration: 50,
    color: "bg-cyan-500",
    days: [1, 3, 5],
  },
];

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hours = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "17:00", "18:00", "19:00", "20:00"];

interface ClassDetails {
  id: number;
  name: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  time: string;
  duration: number;
  color: string;
  days: number[];
}

const ClassesTab = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);

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
    return mockClasses.filter(
      (c) => c.days.includes(dayIndex + 1) && c.time === hour
    );
  };

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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                const classes = getClassesForSlot(dayIndex, hour);
                return (
                  <div
                    key={dayIndex}
                    className="p-2 border-l border-border min-h-[80px]"
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`w-full ${cls.color} text-white rounded-lg p-2 text-left text-sm mb-1 hover:opacity-90 transition-opacity`}
                      >
                        <p className="font-semibold truncate">{cls.name}</p>
                        <p className="text-xs opacity-80">{cls.instructor}</p>
                        <p className="text-xs opacity-80">
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

      {/* Class details dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
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
                <p className="font-semibold">{selectedClass?.instructor}</p>
              </div>
              <div className="card-fitness">
                <p className="text-sm text-muted-foreground mb-1">Duración</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedClass?.duration} min
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
              <Button variant="outline" className="flex-1">
                Ver Inscritos
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
