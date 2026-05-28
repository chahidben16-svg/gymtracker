// data.js — fitness app data model, XP math, demo data, persistence

const STORAGE_KEY = "gym_data_v3";

const MUSCLES = [
  { id: "borst",      name: "Borst",      hue: 18 },
  { id: "rug",        name: "Rug",        hue: 200 },
  { id: "benen",      name: "Benen",      hue: 260 },
  { id: "armen",      name: "Armen",      hue: 40 },
  { id: "schouders",  name: "Schouders",  hue: 320 },
  { id: "core",       name: "Core",       hue: 140 },
];

const EXERCISES = {
  borst: [
    { id: "bench",     name: "Bench Press",         unit: "kg", defaultReps: 8,  defaultWeight: 60 },
    { id: "incline",   name: "Incline Dumbbell",    unit: "kg", defaultReps: 10, defaultWeight: 20 },
    { id: "dips",      name: "Dips",                unit: "bw", defaultReps: 10, defaultWeight: 0 },
    { id: "fly",       name: "Cable Fly",           unit: "kg", defaultReps: 12, defaultWeight: 15 },
    { id: "pushup",    name: "Push-ups",            unit: "bw", defaultReps: 15, defaultWeight: 0 },
  ],
  rug: [
    { id: "deadlift",  name: "Deadlift",            unit: "kg", defaultReps: 5,  defaultWeight: 100 },
    { id: "pullup",    name: "Pull-ups",            unit: "bw", defaultReps: 8,  defaultWeight: 0 },
    { id: "row",       name: "Bent-over Row",       unit: "kg", defaultReps: 8,  defaultWeight: 60 },
    { id: "lat",       name: "Lat Pulldown",        unit: "kg", defaultReps: 10, defaultWeight: 50 },
    { id: "seatedrow", name: "Seated Row",          unit: "kg", defaultReps: 10, defaultWeight: 45 },
  ],
  benen: [
    { id: "squat",     name: "Squat",               unit: "kg", defaultReps: 6,  defaultWeight: 90 },
    { id: "rdl",       name: "Romanian Deadlift",   unit: "kg", defaultReps: 8,  defaultWeight: 70 },
    { id: "legpress",  name: "Leg Press",           unit: "kg", defaultReps: 10, defaultWeight: 140 },
    { id: "lunge",     name: "Walking Lunges",      unit: "kg", defaultReps: 12, defaultWeight: 20 },
    { id: "calf",      name: "Calf Raise",          unit: "kg", defaultReps: 15, defaultWeight: 40 },
  ],
  armen: [
    { id: "curl",      name: "Bicep Curl",          unit: "kg", defaultReps: 10, defaultWeight: 12 },
    { id: "hammer",    name: "Hammer Curl",         unit: "kg", defaultReps: 10, defaultWeight: 14 },
    { id: "tricep",    name: "Tricep Pushdown",     unit: "kg", defaultReps: 12, defaultWeight: 25 },
    { id: "skull",     name: "Skull Crusher",       unit: "kg", defaultReps: 10, defaultWeight: 20 },
    { id: "preacher",  name: "Preacher Curl",       unit: "kg", defaultReps: 10, defaultWeight: 18 },
  ],
  schouders: [
    { id: "ohp",       name: "Overhead Press",      unit: "kg", defaultReps: 6,  defaultWeight: 40 },
    { id: "lateral",   name: "Lateral Raise",       unit: "kg", defaultReps: 12, defaultWeight: 8 },
    { id: "facepull",  name: "Face Pull",           unit: "kg", defaultReps: 15, defaultWeight: 20 },
    { id: "front",     name: "Front Raise",         unit: "kg", defaultReps: 12, defaultWeight: 8 },
    { id: "arnold",    name: "Arnold Press",        unit: "kg", defaultReps: 8,  defaultWeight: 14 },
  ],
  core: [
    { id: "plank",     name: "Plank",               unit: "sec", defaultReps: 60, defaultWeight: 0 },
    { id: "crunch",    name: "Crunches",            unit: "bw",  defaultReps: 20, defaultWeight: 0 },
    { id: "twist",     name: "Russian Twist",       unit: "kg",  defaultReps: 20, defaultWeight: 8 },
    { id: "legraise",  name: "Hanging Leg Raise",   unit: "bw",  defaultReps: 12, defaultWeight: 0 },
    { id: "cablecr",   name: "Cable Crunch",        unit: "kg",  defaultReps: 15, defaultWeight: 30 },
  ],
};

// XP math --------------------------------------------------------------------
// Total XP needed to *reach* level n (so reaching Lv2 needs xpForLevel(2)).
function xpForLevel(n) {
  if (n <= 1) return 0;
  if (n >= 99) n = 99;
  return Math.round(100 * Math.pow(n - 1, 1.4));
}

function levelFromXP(xp) {
  if (xp <= 0) return 1;
  for (let n = 99; n >= 1; n--) {
    if (xp >= xpForLevel(n)) return n;
  }
  return 1;
}

function levelProgress(xp) {
  const lvl = levelFromXP(xp);
  if (lvl >= 99) return { level: 99, into: 1, span: 1, intoXP: 0, spanXP: 0, nextAt: xpForLevel(99) };
  const base = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const span = next - base;
  const into = xp - base;
  return { level: lvl, into: into / span, intoXP: into, spanXP: span, nextAt: next };
}

// XP per set: volume-based. ~1 XP per kg·rep, bodyweight ≈ 8 XP per rep, seconds ≈ 0.3 XP.
function setXP(set, unit) {
  const reps = Number(set.reps) || 0;
  const w    = Number(set.weight) || 0;
  if (unit === "bw") return Math.round(reps * 8);
  if (unit === "sec") return Math.round(reps * 0.3);
  return Math.round(reps * Math.max(w, 1) * 0.4);
}

// Tier names (used when rank_naming = 'tiers')
const TIERS = [
  { min: 1,  max: 9,   name: "Brons",     color: "#a06942" },
  { min: 10, max: 19,  name: "Zilver",    color: "#9aa0a8" },
  { min: 20, max: 34,  name: "Goud",      color: "#d4a23a" },
  { min: 35, max: 49,  name: "Platina",   color: "#6cb3b8" },
  { min: 50, max: 69,  name: "Diamant",   color: "#5b8fd6" },
  { min: 70, max: 89,  name: "Meester",   color: "#9d6dd0" },
  { min: 90, max: 99,  name: "Legende",   color: "#ff7a3d" },
];
function tierForLevel(n) {
  return TIERS.find(t => n >= t.min && n <= t.max) || TIERS[0];
}

// Demo data ------------------------------------------------------------------
function demoData() {
  const today = new Date();
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d.toISOString();
  };
  return {
    user: { name: "Sam", since: day(120) },
    xp: {
      borst:     2050,
      rug:       1380,
      benen:     3320,
      armen:      890,
      schouders:  540,
      core:      1480,
    },
    workouts: [
      {
        id: "w1", date: day(0), muscle: "borst",
        sets: [
          { exercise: "bench",   reps: 8,  weight: 60, unit: "kg" },
          { exercise: "bench",   reps: 8,  weight: 60, unit: "kg" },
          { exercise: "bench",   reps: 6,  weight: 65, unit: "kg" },
          { exercise: "incline", reps: 10, weight: 22, unit: "kg" },
          { exercise: "incline", reps: 9,  weight: 22, unit: "kg" },
        ],
      },
      {
        id: "w2", date: day(2), muscle: "benen",
        sets: [
          { exercise: "squat",    reps: 6, weight: 90,  unit: "kg" },
          { exercise: "squat",    reps: 6, weight: 95,  unit: "kg" },
          { exercise: "squat",    reps: 5, weight: 100, unit: "kg" },
          { exercise: "rdl",      reps: 8, weight: 70,  unit: "kg" },
          { exercise: "legpress", reps: 10, weight: 140, unit: "kg" },
        ],
      },
      {
        id: "w3", date: day(4), muscle: "rug",
        sets: [
          { exercise: "deadlift", reps: 5, weight: 100, unit: "kg" },
          { exercise: "deadlift", reps: 5, weight: 110, unit: "kg" },
          { exercise: "pullup",   reps: 8, weight: 0,   unit: "bw" },
          { exercise: "pullup",   reps: 7, weight: 0,   unit: "bw" },
          { exercise: "row",      reps: 8, weight: 60,  unit: "kg" },
        ],
      },
      {
        id: "w4", date: day(6), muscle: "armen",
        sets: [
          { exercise: "curl",   reps: 10, weight: 12, unit: "kg" },
          { exercise: "curl",   reps: 9,  weight: 14, unit: "kg" },
          { exercise: "tricep", reps: 12, weight: 25, unit: "kg" },
          { exercise: "hammer", reps: 10, weight: 14, unit: "kg" },
        ],
      },
    ],
  };
}

// Persistence ----------------------------------------------------------------
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoData();
    return JSON.parse(raw);
  } catch (e) {
    return demoData();
  }
}
function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) {}
}
function resetData() {
  const fresh = demoData();
  saveData(fresh);
  return fresh;
}
function clearAll() {
  const empty = {
    user: { name: "Sam", since: new Date().toISOString() },
    xp: { borst: 0, rug: 0, benen: 0, armen: 0, schouders: 0, core: 0 },
    workouts: [],
  };
  saveData(empty);
  return empty;
}

// Helpers --------------------------------------------------------------------
function exerciseById(muscleId, exId) {
  return (EXERCISES[muscleId] || []).find(e => e.id === exId);
}
function totalLevel(xpMap) {
  return Object.values(xpMap).reduce((sum, x) => sum + levelFromXP(x), 0);
}
function totalXP(xpMap) {
  return Object.values(xpMap).reduce((sum, x) => sum + x, 0);
}
function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Vandaag";
  if (diff === 1) return "Gisteren";
  if (diff < 7) return `${diff} dagen geleden`;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

Object.assign(window, {
  MUSCLES, EXERCISES, TIERS,
  xpForLevel, levelFromXP, levelProgress, setXP, tierForLevel,
  loadData, saveData, resetData, clearAll, demoData,
  exerciseById, totalLevel, totalXP, formatDate,
});
