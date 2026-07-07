import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { watchAuth, loginWithGoogle, logout, fsGet, fsSet, fsSetShared, fsListShared } from "./firebase.js";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Home, TrendingUp, Wallet, Bot, User as UserIcon, Plus, Trophy, Flame,
  Target, ChevronRight, X, Check, LogIn, Cloud, MapPin, Sparkles,
  Trash2, Settings2, RefreshCw, Coins, ShieldCheck, ArrowUpRight, Loader2,
} from "lucide-react";

/* ============================== THEME TOKENS ============================== */
// Palet fintech gelap: navy-charcoal + emas (simbol tabungan/rupiah) + teal (progres sehat)
const THEME = {
  dark: {
    bg: "#0B1120",
    surface: "#131B2E",
    surface2: "#1A2338",
    border: "#232D45",
    text: "#EDEFF5",
    sub: "#8B93A7",
    gold: "#F2B84B",
    goldDim: "#7A5F27",
    teal: "#2DD4BF",
    coral: "#FF6B6B",
    violet: "#8B7CF6",
  },
  light: {
    bg: "#F4F5F9",
    surface: "#FFFFFF",
    surface2: "#EDEFF6",
    border: "#DDE1EC",
    text: "#141A2A",
    sub: "#5B6478",
    gold: "#C6871F",
    goldDim: "#F2E1BB",
    teal: "#0D9488",
    coral: "#E24545",
    violet: "#6D5AE0",
  },
};

const DISPLAY_FONT = "'Space Grotesk', 'Inter', sans-serif";
const BODY_FONT = "'Inter', sans-serif";
const MONO_FONT = "'JetBrains Mono', 'IBM Plex Mono', monospace";

/* ============================== DATA & KONSTAN ============================== */
const TARGET = 100_000_000;
const MILESTONES = [1e6, 5e6, 10e6, 25e6, 50e6, 75e6, 100e6];
const MILESTONE_LABELS = {
  1000000: "Modal Awal",
  5000000: "Dana Darurat Mini",
  10000000: "Sepuluh Juta",
  25000000: "Seperempat Jalan",
  50000000: "Setengah Jalan",
  75000000: "Tiga Perempat",
  100000000: "100 Juta Pertama",
};

// UMP 2026 seluruh 38 provinsi Indonesia (SK Gubernur berlaku efektif 1 Jan 2026,
// via Kemnaker/PP No. 49/2025) + beberapa UMK kota/kabupaten industri sbg tambahan.
// Nilai bisa berbeda pembulatan antar sumber & bisa berubah — selalu verifikasi
// ke Disnaker/SK Gubernur setempat untuk angka resmi.
const UMR_DATA = {
  // ---- 38 Provinsi (UMP 2026) ----
  "Aceh": 3685616,
  "Sumatera Utara": 3228949,
  "Sumatera Barat": 3182955,
  "Riau": 3780495,
  "Jambi": 3471497,
  "Sumatera Selatan": 3942963,
  "Bengkulu": 2827250,
  "Lampung": 3047734,
  "Kep. Bangka Belitung": 4035000,
  "Kepulauan Riau": 3879520,
  "DKI Jakarta": 5729876,
  "Jawa Barat": 2317601,
  "Jawa Tengah": 2327386,
  "DI Yogyakarta": 2417495,
  "Jawa Timur": 2446880,
  "Banten": 3100881,
  "Bali": 3207459,
  "Nusa Tenggara Barat": 2673861,
  "Nusa Tenggara Timur": 2455898,
  "Kalimantan Barat": 3054552,
  "Kalimantan Tengah": 3686138,
  "Kalimantan Selatan": 3725000,
  "Kalimantan Timur": 3762431,
  "Kalimantan Utara": 3775243,
  "Sulawesi Utara": 4002630,
  "Sulawesi Tengah": 3179565,
  "Sulawesi Selatan": 3921088,
  "Sulawesi Tenggara": 3306496,
  "Gorontalo": 3405144,
  "Sulawesi Barat": 3315934,
  "Maluku": 3334490,
  "Maluku Utara": 3510240,
  "Papua Barat": 3841000,
  "Papua": 4436283,
  "Papua Tengah": 4285848,
  "Papua Pegunungan": 4508714,
  "Papua Selatan": 4508100,
  "Papua Barat Daya": 3766000,
  // ---- Tambahan UMK kota/kabupaten industri (biasanya > UMP induknya) ----
  "Kab. Karawang": 5472365,
  "Kota Bekasi": 5690752,
  "Surabaya": 5288796,
  "Batam": 5357982,
  "Bandung": 4737678,
  "Medan": 4335279,
  "Makassar": 4148179,
  "Semarang": 3701709,
  "Palembang": 3690000,
  "Denpasar": 3400000,
  "Balikpapan": 3600000,
};

const EXPENSE_CATEGORIES = [
  "Makan & Minum", "Transportasi", "Tempat Tinggal", "Cicilan/Utang",
  "Hiburan", "Kesehatan", "Lainnya",
];

const CAT_COLORS = ["#F2B84B", "#2DD4BF", "#8B7CF6", "#FF6B6B", "#5B9DF6", "#F6A85B", "#8B93A7"];

const BADGE_DEFS = [
  { id: "starter", label: "Starter", desc: "Setoran pertama tercatat", icon: "🌱" },
  { id: "m1", label: "Modal Awal", desc: "Tabungan tembus Rp1 juta", icon: "🥉" },
  { id: "m10", label: "Sepuluh Juta", desc: "Tabungan tembus Rp10 juta", icon: "🥈" },
  { id: "m50", label: "Setengah Jalan", desc: "Tabungan tembus Rp50 juta", icon: "🥇" },
  { id: "m100", label: "Juara 100 Juta", desc: "Target Rp100 juta tercapai", icon: "🏆" },
  { id: "streak7", label: "Konsisten 7 Hari", desc: "Streak menabung 7 hari", icon: "🔥" },
  { id: "streak30", label: "Sebulan Penuh", desc: "Streak menabung 30 hari", icon: "🚀" },
  { id: "umr", label: "UMR Warrior", desc: "Aktifkan Mode UMR Indonesia", icon: "🛡️" },
  { id: "sehat", label: "Skor Sehat", desc: "Skor kesehatan finansial ≥ 80", icon: "💚" },
];

/* ============================== UTIL ============================== */
const rupiah = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "Rp0";
  const sign = n < 0 ? "-" : "";
  return sign + "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");
};

const rupiahShort = (n) => {
  if (n >= 1_000_000_000) return "Rp" + (n / 1_000_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000_000) return "Rp" + (n / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  if (n >= 1_000) return "Rp" + (n / 1_000).toFixed(0) + "rb";
  return "Rp" + n;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function computeSaving({ gaji, pengeluaran, cicilan, rate, current, target = TARGET }) {
  const disposable = gaji - pengeluaran - cicilan;
  const rawSaving = gaji * rate;
  const monthlySaving = Math.max(0, Math.min(rawSaving, Math.max(disposable, 0)));
  const remaining = Math.max(0, target - current);
  let months = monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : Infinity;
  if (current >= target) months = 0;
  return { disposable, monthlySaving, remaining, months };
}

function healthScore({ gaji, pengeluaran, cicilan, monthlySaving }) {
  if (!gaji || gaji <= 0) return 0;
  const savingsRatio = monthlySaving / gaji;
  const expenseRatio = pengeluaran / gaji;
  const debtRatio = cicilan / gaji;
  let score = 0;
  score += Math.min(savingsRatio / 0.3, 1) * 40;
  score += Math.max(0, 1 - expenseRatio / 0.7) * 30;
  score += Math.max(0, 1 - debtRatio / 0.5) * 30;
  return Math.round(Math.min(Math.max(score, 0), 100));
}
function healthLabel(score) {
  if (score >= 80) return { text: "Sangat Sehat", color: "teal" };
  if (score >= 60) return { text: "Sehat", color: "gold" };
  if (score >= 40) return { text: "Perlu Perhatian", color: "violet" };
  return { text: "Kritis", color: "coral" };
}

function formatMonths(months) {
  if (!isFinite(months)) return "Belum tercapai";
  if (months <= 0) return "Sudah tercapai! 🎉";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} tahun`);
  if (m > 0) parts.push(`${m} bulan`);
  return parts.join(" ") || "Kurang dari 1 bulan";
}

function xpForLevel(level) { return (level - 1) * 250; }
function levelFromXp(xp) { return Math.floor(xp / 250) + 1; }

/* ============================== STORAGE HELPERS ============================== */
// Data personal disimpan di Firestore per akun Google (uid), supaya sinkron
// antar device. Leaderboard disimpan di koleksi publik "leaderboard".
// currentUid diisi oleh AuthGate setelah user login (lihat di bawah).
let currentUid = null;
export function setStorageUid(uid) { currentUid = uid; }

async function storageGet(key, shared = false) {
  try {
    if (shared) {
      const all = await fsListShared(key);
      const exact = all.find((e) => e.key === key);
      return exact ? JSON.stringify(exact.value) : null;
    }
    if (!currentUid) return null;
    const val = await fsGet(currentUid, key);
    return val !== null && val !== undefined ? JSON.stringify(val) : null;
  } catch (e) { return null; }
}
async function storageSet(key, value, shared = false) {
  try {
    const parsed = JSON.parse(value);
    if (shared) { await fsSetShared(key, parsed); return true; }
    if (!currentUid) return false;
    await fsSet(currentUid, key, parsed);
    return true;
  } catch (e) { return false; }
}
async function storageList(prefix = "", shared = false) {
  try {
    if (shared) {
      const all = await fsListShared(prefix);
      return { keys: all.map((e) => e.key) };
    }
    return { keys: [] };
  } catch (e) { return { keys: [] }; }
}

/* ============================== DEFAULT STATE ============================== */
function defaultProfile() {
  return {
    onboarded: false,
    loggedIn: false,
    name: "",
    email: "",
    anonId: null,
    city: "DKI Jakarta",
    umrMode: false,
    gaji: 5000000,
    pengeluaran: 2500000,
    cicilan: 0,
    tabunganAwal: 0,
    rate: 0.2,
    xp: 0,
    streak: 0,
    lastDepositDate: null,
    badges: [],
    theme: "dark",
  };
}

/* ============================== SMALL UI PRIMITIVES ============================== */
function RingProgress({ percent, size = 172, theme }) {
  const pct = Math.min(Math.max(percent, 0), 100);
  const deg = pct * 3.6;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `conic-gradient(${theme.gold} ${deg}deg, ${theme.surface2} ${deg}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size - 20, height: size - 20, borderRadius: "50%",
          background: theme.surface, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 700, color: theme.text }}>
          {pct.toFixed(1)}%
        </span>
        <span style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, marginTop: 2 }}>
          menuju Rp100jt
        </span>
      </div>
    </div>
  );
}

function Pill({ children, color, theme, style }) {
  return (
    <span
      style={{
        background: theme.surface2, color: color || theme.text,
        fontSize: 11, padding: "4px 10px", borderRadius: 999,
        fontFamily: BODY_FONT, fontWeight: 600, border: `1px solid ${theme.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, theme, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.surface, border: `1px solid ${theme.border}`,
        borderRadius: 18, padding: 16, ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, theme, variant = "primary", style, disabled, type = "button" }) {
  const base = {
    fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, borderRadius: 14,
    padding: "12px 16px", border: "none", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    opacity: disabled ? 0.5 : 1, transition: "transform 0.1s ease",
  };
  const variants = {
    primary: { background: theme.gold, color: "#1B1204" },
    secondary: { background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}` },
    danger: { background: "transparent", color: theme.coral, border: `1px solid ${theme.coral}55` },
    ghost: { background: "transparent", color: theme.sub },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Field({ label, children, theme }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub, fontWeight: 600 }}>{label}</span>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}

const inputStyle = (theme) => ({
  width: "100%", background: theme.surface2, border: `1px solid ${theme.border}`,
  borderRadius: 12, padding: "12px 14px", color: theme.text, fontFamily: MONO_FONT,
  fontSize: 15, outline: "none", boxSizing: "border-box",
});

function MoneyInput({ value, onChange, theme, placeholder }) {
  return (
    <input
      inputMode="numeric"
      style={inputStyle(theme)}
      placeholder={placeholder}
      value={value === 0 ? "" : Number(value).toLocaleString("id-ID")}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        onChange(raw === "" ? 0 : parseInt(raw, 10));
      }}
    />
  );
}

/* ============================== ONBOARDING ============================== */
function Onboarding({ theme, onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", city: "DKI Jakarta", umrMode: false, gaji: 5000000,
    pengeluaran: 2500000, cicilan: 0, tabunganAwal: 0, rate: 0.2,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.umrMode) set("gaji", UMR_DATA[form.city] || form.gaji);
    // eslint-disable-next-line
  }, [form.umrMode, form.city]);

  const steps = [
    {
      title: "Selamat datang 👋",
      body: (
        <div>
          <p style={{ color: theme.sub, fontFamily: BODY_FONT, fontSize: 14, lineHeight: 1.6 }}>
            100 Juta Pertama membantu kamu menghitung, mensimulasikan, dan mempercepat perjalanan
            menuju tabungan pertama senilai Rp100.000.000 — langkah paling berat sekaligus paling
            penting sebelum investasi lebih besar.
          </p>
          <Field label="Siapa nama kamu?" theme={theme}>
            <input style={inputStyle(theme)} value={form.name}
              onChange={(e) => set("name", e.target.value)} placeholder="Nama panggilan" />
          </Field>
        </div>
      ),
    },
    {
      title: "Kota & Mode UMR",
      body: (
        <div>
          <Field label="Kota domisili" theme={theme}>
            <select style={inputStyle(theme)} value={form.city} onChange={(e) => set("city", e.target.value)}>
              {Object.keys(UMR_DATA).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div
            onClick={() => set("umrMode", !form.umrMode)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: theme.surface2, borderRadius: 12, padding: 14, cursor: "pointer",
              border: `1px solid ${form.umrMode ? theme.gold : theme.border}`,
            }}
          >
            <div>
              <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text }}>Mode UMR Indonesia</div>
              <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, marginTop: 2 }}>
                Otomatis isi gaji = UMR {form.city}: {rupiah(UMR_DATA[form.city])}
              </div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 999, background: form.umrMode ? theme.gold : theme.border,
              position: "relative", flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute",
                top: 2, left: form.umrMode ? 20 : 2, transition: "left 0.15s ease",
              }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Angka keuangan kamu",
      body: (
        <div>
          <Field label="Gaji bulanan" theme={theme}>
            <MoneyInput theme={theme} value={form.gaji} onChange={(v) => set("gaji", v)} placeholder="5.000.000" />
          </Field>
          <Field label="Pengeluaran rutin / bulan" theme={theme}>
            <MoneyInput theme={theme} value={form.pengeluaran} onChange={(v) => set("pengeluaran", v)} placeholder="2.500.000" />
          </Field>
          <Field label="Cicilan utang / bulan (0 jika tidak ada)" theme={theme}>
            <MoneyInput theme={theme} value={form.cicilan} onChange={(v) => set("cicilan", v)} placeholder="0" />
          </Field>
          <Field label="Tabungan saat ini" theme={theme}>
            <MoneyInput theme={theme} value={form.tabunganAwal} onChange={(v) => set("tabunganAwal", v)} placeholder="0" />
          </Field>
        </div>
      ),
    },
    {
      title: "Berapa % gaji mau ditabung?",
      body: (
        <div>
          <input type="range" min={10} max={40} value={Math.round(form.rate * 100)}
            onChange={(e) => set("rate", parseInt(e.target.value, 10) / 100)}
            style={{ width: "100%", accentColor: theme.gold }} />
          <div style={{ textAlign: "center", fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 700, color: theme.gold, margin: "10px 0" }}>
            {Math.round(form.rate * 100)}%
          </div>
          <div style={{ textAlign: "center", fontFamily: BODY_FONT, fontSize: 13, color: theme.sub }}>
            ≈ {rupiah(form.gaji * form.rate)} / bulan
          </div>
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, background: theme.bg, zIndex: 50,
      display: "flex", flexDirection: "column", padding: 20, boxSizing: "border-box",
      fontFamily: BODY_FONT,
    }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i <= step ? THEME.dark.gold : theme.border,
          }} />
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <h1 style={{ fontFamily: DISPLAY_FONT, color: theme.text, fontSize: 24, marginBottom: 16 }}>{cur.title}</h1>
        {cur.body}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <Button theme={theme} variant="secondary" onClick={() => setStep((s) => s - 1)} style={{ flex: 1 }}>
            Kembali
          </Button>
        )}
        <Button
          theme={theme}
          onClick={() => (isLast ? onDone(form) : setStep((s) => s + 1))}
          style={{ flex: 2 }}
        >
          {isLast ? "Mulai Menabung" : "Lanjut"} <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD TAB ============================== */
function DashboardTab({ profile, expenses, savingsLog, theme, setTab, onQuickDeposit }) {
  const current = profile.tabunganAwal + savingsLog.reduce((s, l) => s + l.amount, 0);
  const calc = computeSaving({
    gaji: profile.gaji, pengeluaran: profile.pengeluaran, cicilan: profile.cicilan,
    rate: profile.rate, current,
  });
  const percent = Math.min((current / TARGET) * 100, 100);
  const score = healthScore({ ...profile, monthlySaving: calc.monthlySaving });
  const label = healthLabel(score);
  const eta = new Date();
  eta.setMonth(eta.getMonth() + (isFinite(calc.months) ? calc.months : 0));

  const nextMilestone = MILESTONES.find((m) => m > current) || TARGET;
  const monthsToNext = calc.monthlySaving > 0 ? Math.ceil(Math.max(0, nextMilestone - current) / calc.monthlySaving) : Infinity;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card theme={theme} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: `linear-gradient(160deg, ${theme.surface}, ${theme.surface2})` }}>
        <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, color: theme.sub, fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600 }}>
          <Target size={14} /> Berapa Lama Menuju 100 Juta?
        </div>
        <RingProgress percent={percent} theme={theme} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700, color: theme.text }}>
            {formatMonths(calc.months)}
          </div>
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub, marginTop: 2 }}>
            {isFinite(calc.months) && calc.months > 0
              ? `Estimasi tercapai sekitar ${eta.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
              : calc.monthlySaving <= 0 ? "Naikkan tabungan bulanan agar target tercapai" : "Target sudah tercapai 🎉"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <div style={{ flex: 1, background: theme.surface2, borderRadius: 12, padding: 10, textAlign: "center" }}>
            <div style={{ fontFamily: MONO_FONT, color: theme.gold, fontWeight: 700, fontSize: 14 }}>{rupiah(current)}</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: theme.sub }}>Tabungan saat ini</div>
          </div>
          <div style={{ flex: 1, background: theme.surface2, borderRadius: 12, padding: 10, textAlign: "center" }}>
            <div style={{ fontFamily: MONO_FONT, color: theme.teal, fontWeight: 700, fontSize: 14 }}>{rupiah(calc.monthlySaving)}</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: theme.sub }}>Nabung / bulan</div>
          </div>
        </div>
        <Button theme={theme} style={{ width: "100%" }} onClick={onQuickDeposit}>
          <Plus size={16} /> Catat Setoran Hari Ini
        </Button>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.sub, fontSize: 11, fontFamily: BODY_FONT, fontWeight: 700 }}>
            <ShieldCheck size={14} /> SKOR FINANSIAL
          </div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 700, color: theme[label.color], marginTop: 6 }}>{score}</div>
          <Pill theme={theme} color={theme[label.color]} style={{ marginTop: 6 }}>{label.text}</Pill>
        </Card>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.sub, fontSize: 11, fontFamily: BODY_FONT, fontWeight: 700 }}>
            <Flame size={14} /> STREAK NABUNG
          </div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 700, color: theme.gold, marginTop: 6 }}>{profile.streak} hari</div>
          <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, marginTop: 6 }}>Level {levelFromXp(profile.xp)} · {profile.xp} XP</div>
        </Card>
      </div>

      <Card theme={theme}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text }}>Milestone berikutnya</div>
          <span onClick={() => setTab("roadmap")} style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.gold, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            Lihat semua <ChevronRight size={14} />
          </span>
        </div>
        <div style={{ marginTop: 8, fontFamily: BODY_FONT, fontSize: 13, color: theme.sub }}>
          {MILESTONE_LABELS[nextMilestone]} — {rupiah(nextMilestone)}
        </div>
        <div style={{ marginTop: 4, fontFamily: BODY_FONT, fontSize: 12, color: theme.teal }}>
          {isFinite(monthsToNext) ? `≈ ${monthsToNext} bulan lagi` : "Butuh setoran rutin untuk mencapai ini"}
        </div>
      </Card>

      {profile.umrMode && (
        <Card theme={theme} style={{ border: `1px solid ${theme.gold}55` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color={theme.gold} />
            <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text }}>Mode UMR Indonesia · {profile.city}</div>
          </div>
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub, marginTop: 6, lineHeight: 1.5 }}>
            Gaji otomatis memakai estimasi UMR {profile.city} ({rupiah(UMR_DATA[profile.city] || profile.gaji)}/bulan).
            Dengan setoran {Math.round(profile.rate * 100)}% gaji, target Rp100 juta tercapai dalam {formatMonths(calc.months)}.
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================== ROADMAP / SIMULATOR TAB ============================== */
function RoadmapTab({ profile, savingsLog, theme, onRateChange }) {
  const current = profile.tabunganAwal + savingsLog.reduce((s, l) => s + l.amount, 0);
  const calc = computeSaving({ gaji: profile.gaji, pengeluaran: profile.pengeluaran, cicilan: profile.cicilan, rate: profile.rate, current });

  const chartData = useMemo(() => {
    const arr = [];
    const n = isFinite(calc.months) ? Math.min(calc.months, 240) : 60;
    for (let i = 0; i <= n; i++) {
      arr.push({ bulan: i, tabungan: Math.min(TARGET, current + calc.monthlySaving * i) });
    }
    return arr;
  }, [current, calc.monthlySaving, calc.months]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 4 }}>
          Simulasi Menabung 10%–40% Gaji
        </div>
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub, marginBottom: 10 }}>
          Geser untuk melihat perubahan waktu pencapaian secara langsung.
        </div>
        <input type="range" min={10} max={40} value={Math.round(profile.rate * 100)}
          onChange={(e) => onRateChange(parseInt(e.target.value, 10) / 100)}
          style={{ width: "100%", accentColor: theme.gold }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <div>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 26, fontWeight: 700, color: theme.gold }}>{Math.round(profile.rate * 100)}%</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>{rupiah(calc.monthlySaving)}/bulan</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: theme.teal }}>{formatMonths(calc.months)}</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>menuju Rp100 juta</div>
          </div>
        </div>
        {calc.disposable < calc.monthlySaving && calc.monthlySaving > 0 && (
          <div style={{ marginTop: 10, fontFamily: BODY_FONT, fontSize: 11, color: theme.coral }}>
            ⚠ Sisa gaji setelah pengeluaran & cicilan hanya {rupiah(calc.disposable)}, targetkan rate yang realistis.
          </div>
        )}
      </Card>

      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 8 }}>Proyeksi Pertumbuhan Tabungan</div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.gold} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={theme.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fill: theme.sub, fontSize: 10 }} tickLine={false} axisLine={{ stroke: theme.border }} label={{ value: "bulan", position: "insideBottomRight", fill: theme.sub, fontSize: 10 }} />
              <YAxis tickFormatter={rupiahShort} tick={{ fill: theme.sub, fontSize: 10 }} tickLine={false} axisLine={false} width={54} />
              <Tooltip formatter={(v) => rupiah(v)} labelFormatter={(l) => `Bulan ke-${l}`}
                contentStyle={{ background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 10, fontFamily: BODY_FONT, fontSize: 12 }} />
              <Area type="monotone" dataKey="tabungan" stroke={theme.gold} fill="url(#goldFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 12 }}>Jalur Tabungan (Rp1jt → Rp100jt)</div>
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 9, top: 6, bottom: 6, width: 2, background: theme.border }} />
          {MILESTONES.map((m) => {
            const done = current >= m;
            const isNext = !done && MILESTONES.find((x) => x > current) === m;
            return (
              <div key={m} style={{ position: "relative", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  position: "absolute", left: -26, width: 20, height: 20, borderRadius: "50%",
                  background: done ? theme.gold : isNext ? theme.surface : theme.surface2,
                  border: `2px solid ${done ? theme.gold : isNext ? theme.gold : theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done && <Check size={12} color="#1B1204" />}
                </div>
                <div>
                  <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: done ? theme.text : isNext ? theme.gold : theme.sub }}>
                    {MILESTONE_LABELS[m]}
                  </div>
                  <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: theme.sub }}>{rupiah(m)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================== EXPENSE TAB ============================== */
function ExpenseTab({ profile, expenses, theme, addExpense, deleteExpense }) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");

  const thisMonth = expenses.filter((e) => e.date.slice(0, 7) === todayStr().slice(0, 7));
  const total = thisMonth.reduce((s, e) => s + e.amount, 0);
  const byCat = EXPENSE_CATEGORIES.map((c, i) => ({
    name: c, value: thisMonth.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0), color: CAT_COLORS[i],
  })).filter((c) => c.value > 0);

  const submit = () => {
    if (!amount) return;
    addExpense({ id: Date.now().toString(), date: todayStr(), amount, category, note });
    setAmount(0); setNote("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 10 }}>Catat Pengeluaran</div>
        <MoneyInput theme={theme} value={amount} onChange={setAmount} placeholder="Jumlah (Rp)" />
        <select style={{ ...inputStyle(theme), marginTop: 10 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={{ ...inputStyle(theme), marginTop: 10, fontFamily: BODY_FONT }} placeholder="Catatan (opsional)"
          value={note} onChange={(e) => setNote(e.target.value)} />
        <Button theme={theme} style={{ marginTop: 12, width: "100%" }} onClick={submit}><Plus size={16} /> Simpan</Button>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, fontWeight: 700 }}>TOTAL BULAN INI</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: theme.coral, marginTop: 4 }}>{rupiah(total)}</div>
        </Card>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, fontWeight: 700 }}>vs GAJI</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: theme.gold, marginTop: 4 }}>
            {profile.gaji ? Math.round((total / profile.gaji) * 100) : 0}%
          </div>
        </Card>
      </div>

      {byCat.length > 0 && (
        <Card theme={theme}>
          <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 8 }}>Rincian per Kategori</div>
          <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {byCat.map((c, i) => <Cell key={i} fill={c.color} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => rupiah(v)} contentStyle={{ background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {byCat.map((c) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 8 }}>Riwayat Terbaru</div>
        {expenses.length === 0 && <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub }}>Belum ada pengeluaran tercatat.</div>}
        {expenses.slice().reverse().slice(0, 15).map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.border}` }}>
            <div>
              <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.text, fontWeight: 600 }}>{e.category}</div>
              <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>{e.date}{e.note ? ` · ${e.note}` : ""}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: MONO_FONT, fontSize: 13, color: theme.coral }}>-{rupiah(e.amount)}</div>
              <Trash2 size={14} color={theme.sub} style={{ cursor: "pointer" }} onClick={() => deleteExpense(e.id)} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ============================== AI COACH TAB ============================== */
function CoachTab({ profile, savingsLog, expenses, theme }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Halo! Aku AI Coach kamu. Tanya apa saja soal strategi menabung, atau tekan tombol di bawah untuk saran otomatis berdasarkan data keuanganmu." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const current = profile.tabunganAwal + savingsLog.reduce((s, l) => s + l.amount, 0);
  const calc = computeSaving({ gaji: profile.gaji, pengeluaran: profile.pengeluaran, cicilan: profile.cicilan, rate: profile.rate, current });
  const score = healthScore({ ...profile, monthlySaving: calc.monthlySaving });

  const fallbackTips = () => {
    const tips = [];
    if (calc.disposable <= 0) tips.push("Pengeluaran dan cicilanmu menghabiskan seluruh gaji. Coba pangkas biaya non-esensial dulu sebelum menaikkan rate menabung.");
    if (profile.cicilan / profile.gaji > 0.35) tips.push("Cicilan utang di atas 35% gaji — pertimbangkan negosiasi ulang tenor atau prioritaskan pelunasan utang berbunga tinggi.");
    if (profile.streak === 0) tips.push("Mulai dari setoran kecil hari ini, misalnya Rp50.000, untuk membangun streak pertamamu.");
    if (score >= 80) tips.push("Skor finansialmu sangat sehat — pertimbangkan naikkan rate menabung 5% lagi untuk mempercepat target.");
    if (tips.length === 0) tips.push("Konsistensi lebih penting dari nominal besar. Pertahankan setoran rutin tiap bulan.");
    return tips;
  };

  const askCoach = async (question) => {
    setLoading(true);
    const userMsg = { role: "user", text: question };
    setMessages((m) => [...m, userMsg]);
    const context = `Data pengguna:
- Kota: ${profile.city}${profile.umrMode ? " (Mode UMR aktif)" : ""}
- Gaji bulanan: ${rupiah(profile.gaji)}
- Pengeluaran rutin: ${rupiah(profile.pengeluaran)}
- Cicilan utang: ${rupiah(profile.cicilan)}
- Tabungan saat ini: ${rupiah(current)} dari target Rp100.000.000
- Rate menabung: ${Math.round(profile.rate * 100)}%
- Estimasi waktu tercapai: ${formatMonths(calc.months)}
- Skor kesehatan finansial: ${score}/100
- Streak menabung: ${profile.streak} hari

Pertanyaan pengguna: ${question || "Berikan 3 saran singkat dan actionable dalam Bahasa Indonesia untuk mempercepat pencapaian target Rp100 juta, berdasarkan data di atas. Gunakan format poin singkat, nada suportif, sebutkan angka spesifik dari data di atas."}`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY belum diset");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: context }] }],
          }),
        }
      );
      const data = await response.json();
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("\n")
        .trim();
      setMessages((m) => [...m, { role: "assistant", text: text || fallbackTips().join("\n") }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: fallbackTips().join("\n") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%",
            background: m.role === "user" ? theme.gold : theme.surface,
            color: m.role === "user" ? "#1B1204" : theme.text,
            border: m.role === "assistant" ? `1px solid ${theme.border}` : "none",
            borderRadius: 14, padding: 12, fontFamily: BODY_FONT, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5,
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: theme.sub, display: "flex", alignItems: "center", gap: 6, fontFamily: BODY_FONT, fontSize: 12 }}>
            <Loader2 size={14} className="spin" /> AI Coach sedang berpikir...
          </div>
        )}
      </div>
      <Button theme={theme} variant="secondary" style={{ marginBottom: 8 }} disabled={loading} onClick={() => askCoach("")}>
        <Sparkles size={16} /> Saran Otomatis dari Data Saya
      </Button>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ ...inputStyle(theme), fontFamily: BODY_FONT, flex: 1 }}
          placeholder="Tanya AI Coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim() && !loading) { askCoach(input); setInput(""); } }}
        />
        <Button theme={theme} disabled={loading || !input.trim()} onClick={() => { askCoach(input); setInput(""); }}>
          Kirim
        </Button>
      </div>
    </div>
  );
}

/* ============================== PROFILE / LEADERBOARD TAB ============================== */
function ProfileTab({ profile, savingsLog, theme, updateProfile, onToggleTheme, leaderboard, refreshLeaderboard, loadingBoard }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile.gaji, profile.pengeluaran, profile.cicilan, profile.rate, profile.city, profile.umrMode]);

  const current = profile.tabunganAwal + savingsLog.reduce((s, l) => s + l.amount, 0);
  const percent = Math.min((current / TARGET) * 100, 100);
  const level = levelFromXp(profile.xp);
  const xpInLevel = profile.xp - xpForLevel(level);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card theme={theme} style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: theme.gold, color: "#1B1204",
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 20, flexShrink: 0,
        }}>
          {(profile.name || "?").slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 15, color: theme.text }}>{profile.name || "Penabung"}</div>
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub }}>Level {level} · {profile.xp} XP</div>
        </div>
        {!profile.loggedIn ? (
          <Button theme={theme} variant="secondary" onClick={() => updateProfile({ loggedIn: true, email: (profile.name || "user").toLowerCase().replace(/\s/g, "") + "@gmail.com" })}>
            <LogIn size={14} /> Google
          </Button>
        ) : (
          <Pill theme={theme} color={theme.teal}><Cloud size={12} style={{ marginRight: 4, display: "inline" }} />Tersinkron</Pill>
        )}
      </Card>
      {profile.loggedIn && (
        <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: theme.sub, marginTop: -8, textAlign: "center" }}>
          Simulasi login Google · data disimpan lewat cloud sync bawaan artifact ini
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, fontWeight: 700 }}>PROGRES</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: theme.gold }}>{percent.toFixed(1)}%</div>
        </Card>
        <Card theme={theme} style={{ flex: 1 }}>
          <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub, fontWeight: 700 }}>XP MENUJU LEVEL {level + 1}</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 20, fontWeight: 700, color: theme.teal }}>{xpInLevel}/250</div>
        </Card>
      </div>

      <Card theme={theme}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text, marginBottom: 10 }}>Koleksi Badge</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BADGE_DEFS.map((b) => {
            const earned = profile.badges.includes(b.id);
            return (
              <div key={b.id} title={b.desc} style={{
                width: 68, textAlign: "center", opacity: earned ? 1 : 0.3,
                background: theme.surface2, borderRadius: 12, padding: 8,
              }}>
                <div style={{ fontSize: 22 }}>{b.icon}</div>
                <div style={{ fontFamily: BODY_FONT, fontSize: 9, color: theme.sub, marginTop: 2 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card theme={theme}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text }}>Leaderboard Anonim</div>
          <RefreshCw size={14} color={theme.sub} style={{ cursor: "pointer" }} onClick={refreshLeaderboard} className={loadingBoard ? "spin" : ""} />
        </div>
        {leaderboard.length === 0 && <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.sub }}>Belum ada data. Coba refresh.</div>}
        {leaderboard.slice(0, 10).map((u, i) => (
          <div key={u.tag} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0",
            borderBottom: i < leaderboard.length - 1 ? `1px solid ${theme.border}` : "none",
            background: u.tag === profile.anonId ? theme.surface2 : "transparent", borderRadius: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 13, color: theme.sub, width: 18 }}>{i + 1}</span>
              <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.text, fontWeight: u.tag === profile.anonId ? 700 : 500 }}>
                {u.tag}{u.tag === profile.anonId ? " (kamu)" : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>Lv{u.level}</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: theme.gold }}>{u.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
        <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: theme.sub, marginTop: 8 }}>
          Nama disamarkan otomatis — progres dibagikan tanpa data pribadi.
        </div>
      </Card>

      <Card theme={theme}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 13, color: theme.text }}>Pengaturan</div>
          <Settings2 size={16} color={theme.sub} />
        </div>
        <div onClick={onToggleTheme} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}`, cursor: "pointer" }}>
          <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.text }}>Mode Gelap</span>
          <div style={{ width: 40, height: 22, borderRadius: 999, background: profile.theme === "dark" ? theme.gold : theme.border, position: "relative" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: profile.theme === "dark" ? 20 : 2, transition: "left 0.15s ease" }} />
          </div>
        </div>
        <div onClick={() => setEditing((e) => !e)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", cursor: "pointer" }}>
          <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.text }}>Ubah Data Keuangan</span>
          <ChevronRight size={16} color={theme.sub} style={{ transform: editing ? "rotate(90deg)" : "none" }} />
        </div>
        {editing && (
          <div style={{ marginTop: 8 }}>
            <div onClick={() => setForm((f) => ({ ...f, umrMode: !f.umrMode, gaji: !f.umrMode ? (UMR_DATA[f.city] || f.gaji) : f.gaji }))}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surface2, borderRadius: 10, padding: 10, marginBottom: 10, cursor: "pointer" }}>
              <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.text }}>Mode UMR Indonesia</span>
              <div style={{ width: 36, height: 20, borderRadius: 999, background: form.umrMode ? theme.gold : theme.border, position: "relative" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.umrMode ? 18 : 2 }} />
              </div>
            </div>
            <Field label="Kota" theme={theme}>
              <select style={inputStyle(theme)} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, gaji: f.umrMode ? UMR_DATA[e.target.value] : f.gaji }))}>
                {Object.keys(UMR_DATA).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Gaji bulanan" theme={theme}><MoneyInput theme={theme} value={form.gaji} onChange={(v) => setForm((f) => ({ ...f, gaji: v }))} /></Field>
            <Field label="Pengeluaran rutin" theme={theme}><MoneyInput theme={theme} value={form.pengeluaran} onChange={(v) => setForm((f) => ({ ...f, pengeluaran: v }))} /></Field>
            <Field label="Cicilan utang" theme={theme}><MoneyInput theme={theme} value={form.cicilan} onChange={(v) => setForm((f) => ({ ...f, cicilan: v }))} /></Field>
            <Button theme={theme} style={{ width: "100%" }} onClick={() => { updateProfile(form); setEditing(false); }}>Simpan Perubahan</Button>
          </div>
        )}
        <div style={{ marginTop: 14, fontFamily: BODY_FONT, fontSize: 10, color: theme.sub, lineHeight: 1.5 }}>
          Aplikasi ini berjalan sebagai PWA-ready single page. Untuk instalasi ke layar utama di produksi,
          hubungkan ke manifest & service worker sungguhan di luar mode pratinjau ini.
        </div>
      </Card>
    </div>
  );
}

/* ============================== DEPOSIT MODAL ============================== */
function DepositModal({ theme, onClose, onSave }) {
  const [amount, setAmount] = useState(0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 60, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: theme.surface, width: "100%", borderRadius: "20px 20px 0 0", padding: 20, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 16, color: theme.text, fontWeight: 700 }}>Catat Setoran Tabungan</div>
          <X size={20} color={theme.sub} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <MoneyInput theme={theme} value={amount} onChange={setAmount} placeholder="Nominal setoran" />
        <Button theme={theme} style={{ width: "100%", marginTop: 14 }} onClick={() => amount > 0 && onSave(amount)}>
          <Coins size={16} /> Simpan Setoran
        </Button>
      </div>
    </div>
  );
}

/* ============================== APP ROOT ============================== */
function MainApp({ user, onLogout }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(defaultProfile());
  const [expenses, setExpenses] = useState([]);
  const [savingsLog, setSavingsLog] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [showDeposit, setShowDeposit] = useState(false);
  const [toast, setToast] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const theme = THEME[profile.theme] || THEME.dark;

  // ------- load from storage (Firestore, per akun) on mount -------
  useEffect(() => {
    setStorageUid(user.uid);
    (async () => {
      const p = await storageGet("profile", false);
      const e = await storageGet("expenses", false);
      const s = await storageGet("savingslog", false);
      let prof = defaultProfile();
      if (p) { try { prof = { ...prof, ...JSON.parse(p) }; } catch (e2) {} }
      if (!prof.anonId) prof.anonId = "Penabung#" + Math.floor(1000 + Math.random() * 9000);
      if (!prof.name && user.displayName) prof.name = user.displayName;
      setProfile(prof);
      if (e) { try { setExpenses(JSON.parse(e)); } catch (e2) {} }
      if (s) { try { setSavingsLog(JSON.parse(s)); } catch (e2) {} }
      setLoaded(true);
    })();
  }, [user.uid]);

  // ------- persist on change -------
  useEffect(() => { if (loaded) storageSet("profile", JSON.stringify(profile), false); }, [profile, loaded]);
  useEffect(() => { if (loaded) storageSet("expenses", JSON.stringify(expenses), false); }, [expenses, loaded]);
  useEffect(() => { if (loaded) storageSet("savingslog", JSON.stringify(savingsLog), false); }, [savingsLog, loaded]);

  const showToast = (text) => { setToast(text); setTimeout(() => setToast(null), 2500); };

  const grantBadge = useCallback((id) => {
    setProfile((p) => p.badges.includes(id) ? p : { ...p, badges: [...p.badges, id] });
  }, []);

  const addXp = (amount) => setProfile((p) => ({ ...p, xp: p.xp + amount }));

  const checkMilestoneBadges = useCallback((current) => {
    if (current >= 1e6) grantBadge("m1");
    if (current >= 10e6) grantBadge("m10");
    if (current >= 50e6) grantBadge("m50");
    if (current >= 100e6) grantBadge("m100");
  }, [grantBadge]);

  const updateProfile = (patch) => setProfile((p) => ({ ...p, ...patch }));

  const onOnboardingDone = (form) => {
    setProfile((p) => ({
      ...p, ...form, onboarded: true,
      anonId: p.anonId || "Penabung#" + Math.floor(1000 + Math.random() * 9000),
      xp: 50,
    }));
    if (form.umrMode) grantBadge("umr");
    showToast("Selamat datang! +50 XP");
  };

  const handleDeposit = (amount) => {
    const today = todayStr();
    setSavingsLog((log) => [...log, { date: today, amount }]);
    setProfile((p) => {
      let streak = p.streak;
      if (p.lastDepositDate) {
        const gap = daysBetween(p.lastDepositDate, today);
        if (gap === 1) streak += 1;
        else if (gap > 1) streak = 1;
        // gap 0 (deposit lagi hari yang sama) -> streak tetap
      } else {
        streak = 1;
      }
      const badges = [...p.badges];
      if (!badges.includes("starter")) badges.push("starter");
      if (streak >= 7 && !badges.includes("streak7")) badges.push("streak7");
      if (streak >= 30 && !badges.includes("streak30")) badges.push("streak30");
      return { ...p, lastDepositDate: today, streak, xp: p.xp + 10 + (streak % 7 === 0 ? 50 : 0), badges };
    });
    setShowDeposit(false);
    showToast("Setoran tercatat! +10 XP");
  };

  const addExpense = (exp) => {
    setExpenses((list) => [...list, exp]);
    addXp(5);
  };
  const deleteExpense = (id) => setExpenses((list) => list.filter((e) => e.id !== id));

  const onRateChange = (rate) => updateProfile({ rate });

  // ------- derived: current savings, health score badge, milestone check -------
  const current = profile.tabunganAwal + savingsLog.reduce((s, l) => s + l.amount, 0);
  useEffect(() => { if (loaded) checkMilestoneBadges(current); }, [current, loaded, checkMilestoneBadges]);
  useEffect(() => {
    if (!loaded) return;
    const calc = computeSaving({ gaji: profile.gaji, pengeluaran: profile.pengeluaran, cicilan: profile.cicilan, rate: profile.rate, current });
    const score = healthScore({ ...profile, monthlySaving: calc.monthlySaving });
    if (score >= 80) grantBadge("sehat");
    // eslint-disable-next-line
  }, [profile.gaji, profile.pengeluaran, profile.cicilan, profile.rate, current, loaded]);

  // ------- leaderboard (shared storage) -------
  const refreshLeaderboard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const list = await storageList("leaderboard:", true);
      const keys = (list && list.keys) || [];
      const entries = [];
      for (const k of keys.slice(0, 30)) {
        try {
          const raw = await storageGet(k, true);
          if (raw) entries.push(JSON.parse(raw));
        } catch (e) {}
      }
      entries.sort((a, b) => b.percent - a.percent);
      setLeaderboard(entries);
    } catch (e) {}
    setLoadingBoard(false);
  }, []);

  useEffect(() => {
    if (!loaded || !profile.anonId) return;
    const calc = computeSaving({ gaji: profile.gaji, pengeluaran: profile.pengeluaran, cicilan: profile.cicilan, rate: profile.rate, current });
    const percent = Math.min((current / TARGET) * 100, 100);
    const payload = JSON.stringify({ tag: profile.anonId, percent, level: levelFromXp(profile.xp), updatedAt: Date.now() });
    storageSet("leaderboard:" + profile.anonId, payload, true).then(() => refreshLeaderboard());
    // eslint-disable-next-line
  }, [loaded, profile.anonId, profile.xp, current]);

  useEffect(() => { if (loaded) refreshLeaderboard(); }, [loaded, refreshLeaderboard]);

  if (!loaded) {
    return (
      <div style={{ height: "100vh", background: THEME.dark.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 color={THEME.dark.gold} className="spin" size={28} />
      </div>
    );
  }

  if (!profile.onboarded) {
    return <Onboarding theme={theme} onDone={onOnboardingDone} />;
  }

  const NAV = [
    { id: "dashboard", label: "Beranda", icon: Home },
    { id: "roadmap", label: "Roadmap", icon: TrendingUp },
    { id: "expense", label: "Catat", icon: Wallet },
    { id: "coach", label: "AI Coach", icon: Bot },
    { id: "profile", label: "Profil", icon: UserIcon },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: BODY_FONT, color: theme.text, paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input, select { font-family: inherit; }
        select option { background: ${theme.surface2}; color: ${theme.text}; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: theme.text, letterSpacing: -0.3 }}>
              100 Juta <span style={{ color: theme.gold }}>Pertama</span>
            </div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.sub }}>Halo, {profile.name || "Penabung"} 👋</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill theme={theme} color={theme.gold}>{profile.city}</Pill>
            {user.photoURL && (
              <img src={user.photoURL} alt="" width={28} height={28}
                   style={{ borderRadius: "50%", border: `1px solid ${theme.border}` }} />
            )}
            <button onClick={onLogout} title="Logout"
                    style={{ background: "none", border: "none", color: theme.sub, cursor: "pointer", fontSize: 11, fontFamily: BODY_FONT }}>
              Keluar
            </button>
          </div>
        </div>

        {tab === "dashboard" && (
          <DashboardTab profile={profile} expenses={expenses} savingsLog={savingsLog} theme={theme} setTab={setTab} onQuickDeposit={() => setShowDeposit(true)} />
        )}
        {tab === "roadmap" && (
          <RoadmapTab profile={profile} savingsLog={savingsLog} theme={theme} onRateChange={onRateChange} />
        )}
        {tab === "expense" && (
          <ExpenseTab profile={profile} expenses={expenses} theme={theme} addExpense={addExpense} deleteExpense={deleteExpense} />
        )}
        {tab === "coach" && (
          <CoachTab profile={profile} savingsLog={savingsLog} expenses={expenses} theme={theme} />
        )}
        {tab === "profile" && (
          <ProfileTab
            profile={profile} savingsLog={savingsLog} theme={theme}
            updateProfile={updateProfile}
            onToggleTheme={() => updateProfile({ theme: profile.theme === "dark" ? "light" : "dark" })}
            leaderboard={leaderboard} refreshLeaderboard={refreshLeaderboard} loadingBoard={loadingBoard}
          />
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: theme.surface,
        borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around",
        padding: "10px 0 max(10px, env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto",
      }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <div key={n.id} onClick={() => setTab(n.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", width: 60 }}>
              <Icon size={20} color={active ? theme.gold : theme.sub} />
              <span style={{ fontFamily: BODY_FONT, fontSize: 9, color: active ? theme.gold : theme.sub, fontWeight: active ? 700 : 500 }}>{n.label}</span>
            </div>
          );
        })}
      </div>

      {showDeposit && <DepositModal theme={theme} onClose={() => setShowDeposit(false)} onSave={handleDeposit} />}

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: theme.gold, color: "#1B1204", padding: "8px 16px", borderRadius: 999,
          fontFamily: BODY_FONT, fontWeight: 700, fontSize: 12, zIndex: 70,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ------- Gerbang login: wajib login Google sebelum masuk aplikasi -------
function LoginScreen({ onLogin, loading, error }) {
  const theme = THEME.dark;
  return (
    <div style={{
      height: "100vh", background: theme.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, fontFamily: BODY_FONT, color: theme.text,
    }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 24, marginBottom: 6, textAlign: "center" }}>
        100 Juta <span style={{ color: theme.gold }}>Pertama</span>
      </div>
      <div style={{ fontSize: 13, color: theme.sub, marginBottom: 32, textAlign: "center" }}>
        Masuk dengan akun Google untuk mulai menabung & sinkron data kamu.
      </div>
      <button
        onClick={onLogin}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 10, background: "#fff", color: "#1f1f1f",
          border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 14, fontWeight: 600,
          fontFamily: BODY_FONT, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? <Loader2 size={18} className="spin" /> : (
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3c-7.6 0-14.1 4.3-17.4 10.6z"/><path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.9 26.9 36.8 24 36.8c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.8 40.6 16.3 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.6-6.6 7.1l6.6 5.6C38.9 38.4 45 32.1 45 24c0-1.4-.1-2.7-.4-3.5z"/></svg>
        )}
        {loading ? "Menghubungkan..." : "Masuk dengan Google"}
      </button>
      {error && <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 16, textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export default function AuthGate() {
  const [user, setUser] = useState(undefined); // undefined = belum dicek, null = belum login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = watchAuth((u) => setUser(u || null));
    return unsub;
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError("Gagal login: " + (e?.message || "coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) {}
  };

  if (user === undefined) {
    return (
      <div style={{ height: "100vh", background: THEME.dark.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 color={THEME.dark.gold} className="spin" size={28} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loading} error={error} />;
  }

  return <MainApp user={user} onLogout={handleLogout} />;
}
