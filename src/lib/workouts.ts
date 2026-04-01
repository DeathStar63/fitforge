export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl: string;
  sets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  completed: boolean;
}

export interface WorkoutDay {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  exercises: Exercise[];
  dayNumbers: number[]; // 0=Sun, 1=Mon, ...
}

export const workoutDays: WorkoutDay[] = [
  {
    id: "legs",
    name: "Legs & Core",
    subtitle: "Quads, Hamstrings, Glutes, Abs",
    emoji: "🦵",
    dayNumbers: [1, 4], // Mon, Thu
    exercises: [
      {
        id: "barbell-squat",
        name: "Barbell Squats",
        muscle: "Quads & Glutes",
        gifUrl: "https://static.exercisedb.dev/media/s7HX1BY.gif",
        sets: 3,
        targetRepsMin: 6,
        targetRepsMax: 8,
      },
      {
        id: "romanian-deadlift",
        name: "Romanian Deadlifts",
        muscle: "Hamstrings & Glutes",
        gifUrl: "https://static.exercisedb.dev/media/wQ2c4XD.gif",
        sets: 3,
        targetRepsMin: 6,
        targetRepsMax: 8,
      },
      {
        id: "leg-press",
        name: "Leg Press",
        muscle: "Quads & Glutes",
        gifUrl: "https://static.exercisedb.dev/media/2Qh2J1e.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "leg-extension",
        name: "Leg Extensions",
        muscle: "Quads",
        gifUrl: "https://static.exercisedb.dev/media/my33uHU.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "leg-curl",
        name: "Seated Leg Curls",
        muscle: "Hamstrings",
        gifUrl: "https://static.exercisedb.dev/media/Zg3XY7P.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "barbell-hip-thrust",
        name: "Barbell Hip Thrusts",
        muscle: "Glutes",
        gifUrl: "https://static.exercisedb.dev/media/qKBpF7I.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "seated-calf-raise",
        name: "Seated Calf Raises",
        muscle: "Calves (Soleus)",
        gifUrl: "https://static.exercisedb.dev/media/bOOdeyc.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "decline-crunch",
        name: "Decline Crunches",
        muscle: "Lower Abs",
        gifUrl: "https://static.exercisedb.dev/media/9Ap7miY.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "cable-crunch",
        name: "Cable Crunches",
        muscle: "Upper Abs",
        gifUrl: "https://static.exercisedb.dev/media/WW95auq.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
    ],
  },
  {
    id: "push",
    name: "Push",
    subtitle: "Chest, Shoulders, Triceps",
    emoji: "💪",
    dayNumbers: [2, 5], // Tue, Fri
    exercises: [
      {
        id: "barbell-bench-press",
        name: "Barbell Bench Press",
        muscle: "Chest",
        gifUrl: "https://static.exercisedb.dev/media/EIeI8Vf.gif",
        sets: 3,
        targetRepsMin: 6,
        targetRepsMax: 8,
      },
      {
        id: "incline-db-press",
        name: "Incline Dumbbell Press",
        muscle: "Upper Chest",
        gifUrl: "https://static.exercisedb.dev/media/ns0SIbU.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "cable-crossover",
        name: "Cable Crossovers",
        muscle: "Chest (Isolation)",
        gifUrl: "https://static.exercisedb.dev/media/0CXGHya.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "seated-shoulder-press",
        name: "Seated DB Shoulder Press",
        muscle: "Front Delts",
        gifUrl: "https://static.exercisedb.dev/media/znQUdHY.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "db-lateral-raise",
        name: "DB Lateral Raises",
        muscle: "Side Delts",
        gifUrl: "https://static.exercisedb.dev/media/DsgkuIt.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "front-db-raise",
        name: "Front Dumbbell Raises",
        muscle: "Front Delts",
        gifUrl: "https://static.exercisedb.dev/media/3eGE2JC.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "cable-overhead-tricep",
        name: "Cable Overhead Tricep Ext.",
        muscle: "Tricep Long Head",
        gifUrl: "https://static.exercisedb.dev/media/2IxROQ1.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "tricep-pushdown",
        name: "Tricep Rope Pushdowns",
        muscle: "Tricep Lateral Head",
        gifUrl: "https://static.exercisedb.dev/media/3ZflifB.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "overhead-tricep-ext",
        name: "Overhead DB Tricep Ext.",
        muscle: "Tricep (Stretch)",
        gifUrl: "https://static.exercisedb.dev/media/kont8Ut.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
    ],
  },
  {
    id: "pull",
    name: "Pull",
    subtitle: "Back, Biceps, Rear Delts",
    emoji: "🏋️",
    dayNumbers: [3, 6], // Wed, Sat
    exercises: [
      {
        id: "barbell-row",
        name: "Barbell Rows",
        muscle: "Back (Thickness)",
        gifUrl: "https://static.exercisedb.dev/media/eZyBC3j.gif",
        sets: 3,
        targetRepsMin: 6,
        targetRepsMax: 8,
      },
      {
        id: "lat-pulldown",
        name: "Lat Pulldowns",
        muscle: "Back (Width)",
        gifUrl: "https://static.exercisedb.dev/media/qdRxqCj.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "seated-cable-row",
        name: "Seated Cable Rows",
        muscle: "Mid-Back",
        gifUrl: "https://static.exercisedb.dev/media/fUBheHs.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "straight-arm-pulldown",
        name: "Straight Arm Pulldowns",
        muscle: "Lats (Isolation)",
        gifUrl: "https://static.exercisedb.dev/media/x69MAlq.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "face-pull",
        name: "Face Pulls",
        muscle: "Rear Delts / Posture",
        gifUrl: "https://static.exercisedb.dev/media/wqNPGCg.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "single-arm-db-row",
        name: "Single Arm DB Row",
        muscle: "Back (Thickness)",
        gifUrl: "https://static.exercisedb.dev/media/C0MA9bC.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "dumbbell-bicep-curl",
        name: "Dumbbell Bicep Curls",
        muscle: "Biceps",
        gifUrl: "https://static.exercisedb.dev/media/NbVPDMW.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "preacher-curl",
        name: "Preacher Curls",
        muscle: "Bicep Peak",
        gifUrl: "https://static.exercisedb.dev/media/jivWf8n.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
      {
        id: "hammer-curl",
        name: "Hammer Curls",
        muscle: "Forearms & Biceps",
        gifUrl: "https://static.exercisedb.dev/media/slDvUAU.gif",
        sets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      },
    ],
  },
];

export function getTodaysWorkout(): WorkoutDay | null {
  const today = new Date().getDay(); // 0=Sun
  if (today === 0) return null; // Rest day
  return workoutDays.find((w) => w.dayNumbers.includes(today)) || null;
}

export function getWorkoutByDay(dayNumber: number): WorkoutDay | null {
  if (dayNumber === 0) return null;
  return workoutDays.find((w) => w.dayNumbers.includes(dayNumber)) || null;
}

export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
