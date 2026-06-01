// data.js — fitness app data model, XP math, demo data, persistence

const STORAGE_KEY = "gym_data_v4";

const MUSCLES = [
  { id: "borst",     name: "Borst",     hue: 18 },
  { id: "rug",       name: "Rug",       hue: 200 },
  { id: "benen",     name: "Benen",     hue: 260 },
  { id: "biceps",    name: "Biceps",    hue: 40 },
  { id: "triceps",   name: "Triceps",   hue: 160 },
  { id: "schouders", name: "Schouders", hue: 320 },
  { id: "core",      name: "Core",      hue: 140 },
];

const EXERCISES = {
  borst: [
    { id: "inclinesmith", name: "Incline Smith",       unit: "kg", defaultReps: 10, defaultWeight: 40 },
    { id: "pecdeck",      name: "Pec Deck",            unit: "kg", defaultReps: 12, defaultWeight: 30 },
    { id: "hightolowcable", name: "High to Low Cable", unit: "kg", defaultReps: 12, defaultWeight: 15 },
    { id: "dips",         name: "Dips",                unit: "bw", defaultReps: 10, defaultWeight: 0  },
    { id: "chestpress",   name: "Chest Press",         unit: "kg", defaultReps: 10, defaultWeight: 50 },
  ],
  rug: [
    { id: "pullup",    name: "Pull-ups",         unit: "bw", defaultReps: 8,  defaultWeight: 0  },
    { id: "lat",       name: "Lat Pulldown",     unit: "kg", defaultReps: 10, defaultWeight: 50 },
    { id: "row",       name: "Rows",             unit: "kg", defaultReps: 10, defaultWeight: 50 },
    { id: "upperback", name: "Upper Back Rows",  unit: "kg", defaultReps: 12, defaultWeight: 30 },
  ],
  benen: [
    { id: "smithsquat",  name: "Smith Squats",       unit: "kg", defaultReps: 10, defaultWeight: 60  },
    { id: "legpress",    name: "Leg Press",           unit: "kg", defaultReps: 10, defaultWeight: 140 },
    { id: "calfraise",   name: "Calf Raise",          unit: "kg", defaultReps: 15, defaultWeight: 40  },
    { id: "hamstring",   name: "Hamstring Machine",   unit: "kg", defaultReps: 12, defaultWeight: 40  },
  ],
  biceps: [
    { id: "hammer",   name: "Hammer Curls",      unit: "kg", defaultReps: 10, defaultWeight: 14 },
    { id: "preacher", name: "Preacher Machine",  unit: "kg", defaultReps: 10, defaultWeight: 20 },
  ],
  triceps: [
    { id: "singlepushdown", name: "Single Arm Pushdown",  unit: "kg", defaultReps: 12, defaultWeight: 15 },
    { id: "overheadpress",  name: "Overhead Press",       unit: "kg", defaultReps: 12, defaultWeight: 20 },
  ],
  schouders: [
    { id: "singlelateral",  name: "Single Arm Lat Raise", unit: "kg", defaultReps: 12, defaultWeight: 8  },
    { id: "shoulderpress",  name: "Shoulder Press",       unit: "kg", defaultReps: 10, defaultWeight: 30 },
    { id: "reardelts",      name: "Rear Delts",           unit: "kg", defaultReps: 12, defaultWeight: 10 },
  ],
  core: [
    { id: "cablecr",  name: "Cable Crunch",          unit: "kg", defaultReps: 15, defaultWeight: 30 },
    { id: "legraise", name: "Leg Raise",              unit: "bw", defaultReps: 15, defaultWeight: 0  },
    { id: "obliques", name: "Obliques Twist",         unit: "kg", defaultReps: 20, defaultWeight: 8  },
    { id: "declineabs", name: "Decline Weighted Abs", unit: "kg", defaultReps: 15, defaultWeight: 10 },
  ],
};

// XP math --------------------------------------------------------------------
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

function setXP(set, unit) {
  const reps = Number(set.reps) || 0;
  const w    = Number(set.weight) || 0;
  if (unit === "bw")  return Math.round(reps * 8);
  if (unit === "sec") return Math.round(reps * 0.3);
  return Math.round(reps * Math.max(w, 1) * 0.4);
}

const TIERS = [
  { min: 1,  max: 9,   name: "Brons",   color: "#a06942" },
  { min: 10, max: 19,  name: "Zilver",  color: "#9aa0a8" },
  { min: 20, max: 34,  name: "Goud",    color: "#d4a23a" },
  { min: 35, max: 49,  name: "Platina", color: "#6cb3b8" },
  { min: 50, max: 69,  name: "Diamant", color: "#5b8fd6" },
  { min: 70, max: 89,  name: "Meester", color: "#9d6dd0" },
  { min: 90, max: 99,  name: "Legende", color: "#ff7a3d" },
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
      borst: 0, rug: 0, benen: 0,
      biceps: 0, triceps: 0, schouders: 0, core: 0,
    },
    workouts: [],
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
    xp: { borst: 0, rug: 0, benen: 0, biceps: 0, triceps: 0, schouders: 0, core: 0 },
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
