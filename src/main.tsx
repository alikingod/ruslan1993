import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Command,
  FileLock2,
  FlaskConical,
  Gauge,
  Gift,
  GraduationCap,
  Hexagon,
  Lock,
  Phone,
  Power,
  Radio,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import {
  calendar,
  KEY,
  initialGame,
  play,
  won,
  finalReady,
  achievements,
} from "./engine.mjs";
import "./style.css";
type Progress = { ids: string[]; difficulty: number; game: typeof initialGame };
const fresh = (): Progress => ({
  ids: [],
  difficulty: 1,
  game: { ...initialGame },
});
function read(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    return p &&
      Array.isArray(p.ids) &&
      p.ids.every((id: unknown) => typeof id === "string") &&
      [1, 2, 3].includes(p.difficulty) &&
      Object.keys(initialGame).every(
        (k) =>
          typeof p.game?.[k] ===
          typeof initialGame[k as keyof typeof initialGame],
      )
      ? p
      : fresh();
  } catch {
    return fresh();
  }
}
const Ctx = createContext<any>(null);
const useApp = () => useContext(Ctx);
const nav = [
  ["/dashboard", "Центр управления", Gauge],
  ["/dossier", "Досье легенды", FileLock2],
  ["/simulator", "Симулятор", FlaskConical],
  ["/mentor", "Связь с наставником", Radio],
  ["/academy", "Академия Руси", GraduationCap],
  ["/achievements", "Достижения", Trophy],
  ["/final", "Секретный финал", Lock],
] as const;
function App() {
  const [p, setP] = useState<Progress>(read);
  const [sound, setSound] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"birthday" | "reset" | null>(null);
  const [party, setParty] = useState(0);
  const [date, setDate] = useState(() => calendar());
  const [storageError, setStorageError] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [p]);
  useEffect(() => {
    const t = setInterval(() => setDate(calendar()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (date.birthday) {
      setModal("birthday");
      setParty((x) => x + 1);
      unlock("birth");
    }
  }, [date.birthday]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  function beep(freq = 550) {
    if (!sound) return;
    try {
      const a =
        audio.current ??
        new (window.AudioContext || (window as any).webkitAudioContext)();
      audio.current = a;
      void a.resume();
      const o = a.createOscillator(),
        g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.18);
      o.start();
      o.stop(a.currentTime + 0.2);
    } catch {}
  }
  function unlock(id: string) {
    setP((old) =>
      old.ids.includes(id) ? old : { ...old, ids: [...old.ids, id] },
    );
    if (!p.ids.includes(id)) {
      setToast("Достижение: " + achievements.find((a) => a.id === id)?.name);
      beep(880);
    }
  }
  return (
    <Ctx.Provider
      value={{
        p,
        setP,
        sound,
        setSound,
        toast: setToast,
        unlock,
        beep,
        setModal,
        party: () => setParty((x) => x + 1),
        date,
      }}
    >
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <Shell storageError={storageError} />
          <AnimatePresence>
            {toast && (
              <motion.div
                className="toast"
                role="status"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Trophy size={20} />
                {toast}
                <button
                  aria-label="Закрыть уведомление"
                  onClick={() => setToast("")}
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {modal && (
            <Modal close={() => setModal(null)}>
              {modal === "reset" ? (
                <>
                  <small>НОВАЯ СМЕНА</small>
                  <h2>Сбросить прогресс?</h2>
                  <p>
                    Достижения и результаты симулятора будут удалены с этого
                    устройства.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setP(fresh());
                      setModal(null);
                      setToast("Новая смена. Легенда всё ещё на месте.");
                    }}
                  >
                    Да, начать заново
                  </button>
                </>
              ) : (
                <Birthday />
              )}
            </Modal>
          )}
          <Confetti key={party} active={party > 0} />
        </HashRouter>
      </MotionConfig>
    </Ctx.Provider>
  );
}
function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.focus();
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button,a,input,select,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", f);
    return () => {
      document.removeEventListener("keydown", f);
      old?.focus();
    };
  }, []);
  return (
    <div className="modal-back" onClick={close}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-label="Системное окно"
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={close} aria-label="Закрыть">
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
function Confetti({ active }: { active: boolean }) {
  return active ? (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${i * 2.4}%`,
            animationDelay: `${(i % 7) * 0.12}s`,
            background: i % 2 ? "#ffb800" : "#ffe2a2",
            transform: `rotate(${i * 37}deg)`,
          }}
        />
      ))}
    </div>
  ) : null;
}
function Shell({ storageError }: { storageError: boolean }) {
  const { sound, setSound, p, setModal, date } = useApp();
  const loc = useLocation();
  const [clicks, setClicks] = useState(0);
  const { unlock, toast, beep } = useApp();
  const isBoot = loc.pathname === "/";
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div className={date.birthday ? "app birthday" : "app"}>
      {!isBoot && (
        <>
          <aside>
            <button
              className="brand"
              aria-label="Логотип РУСЯ 1993"
              onClick={() => {
                setClicks((c) => c + 1);
                if (clicks >= 4) {
                  unlock("secret");
                  toast("Протокол 1993: логотип узнал своего.");
                  setClicks(0);
                }
              }}
            >
              <span className="brand-mark">
                <Hexagon />
                <b>Р</b>
              </span>
              <span>
                РУСЯ <em>1993</em>
                <small>LEGEND CONTROL SYSTEM</small>
              </span>
            </button>
            <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
            <nav>
              {nav.map(([path, label, Icon], i) => (
                <NavLink key={path} to={path} onClick={() => beep(480)}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {i === 6 ? (
                    <span className="nav-count">
                      {finalReady(p.ids) ? "✓" : "?"}
                    </span>
                  ) : (
                    <span className="nav-index">0{i + 1}</span>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="access panel">
              <ShieldCheck size={23} />
              <small>УРОВЕНЬ ДОСТУПА</small>
              <strong>Легендарный</strong>
              <span>
                <i className="dot" /> Соединение защищено
              </span>
            </div>
            <div className="sidebar-bottom">
              <span>
                RUSYA OS <b>v.19.93</b>
              </span>
              <button
                onClick={() => setModal("reset")}
                aria-label="Сбросить прогресс"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </aside>
          <header>
            <div className="crumb">
              СИСТЕМА <ChevronRight size={13} />
              <span>
                {nav.find((n) => n[0] === loc.pathname)?.[1] || "Терминал"}
              </span>
            </div>
            <div className="header-right">
              <span className="online">
                <i className="dot" /> СИСТЕМА В НОРМЕ
              </span>
              <button
                className="icon-button"
                onClick={() => setSound(!sound)}
                aria-label={sound ? "Выключить звук" : "Включить звук"}
              >
                {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                className="icon-button"
                onClick={() => setModal("birthday")}
                aria-label="Предпросмотр дня рождения"
              >
                <Gift size={18} />
              </button>
              <span className="avatar">Р</span>
            </div>
          </header>
        </>
      )}
      <main className={isBoot ? "boot-main" : ""}>
        {storageError && (
          <p role="alert" className="warning">
            Браузер запретил сохранение. Прогресс доступен только до закрытия
            вкладки.
          </p>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Routes>
              <Route path="/" element={<Boot />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dossier" element={<Dossier />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/mentor" element={<Mentor />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/final" element={<Final />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        {!isBoot && (
          <footer>
            <span>
              <i className="dot" /> ОБЪЕКТ РУСЯ-1993 ПОД НАБЛЮДЕНИЕМ
            </span>
            <span>
              Дружеская пародия. Неофициальная система. Все показатели
              вымышлены.
            </span>
          </footer>
        )}
      </main>
      {!isBoot && (
        <nav className="mobile-nav">
          {nav.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              aria-label={label}
              onClick={() => beep(480)}
            >
              <Icon size={20} />
              <span>{label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
const bootLines = [
  "Инициализация системы…",
  "Подключение к базе легенд…",
  "Сканирование производственного персонала…",
  "Обнаружен объект: РУСЛАН",
  "Позывной: РУСЯ",
  "Дата выпуска: 28.12.1993",
  "Проверка профессионализма…",
  "ОШИБКА: ПОКАЗАТЕЛЬ ПРЕВЫШАЕТ ДОПУСТИМЫЙ ПРЕДЕЛ",
  "Запуск РУСЯ 1993…",
];
function Boot() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 9)), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="boot">
      <div className="eyebrow">
        <span className="dot" /> ЗАСЕКРЕЧЕННЫЙ ПРОТОКОЛ · 1993
      </div>
      <div className="boot-logo">
        РУСЯ <span>1993</span>
      </div>
      <h2>ЧЕЛОВЕК. НАСТАВНИК. СГУСТИТЕЛЬ.</h2>
      <div className="boot-terminal panel">
        {bootLines.slice(0, step).map((s, i) => (
          <div key={s} className={i === 7 ? "amber" : ""}>
            <span>{String(i + 1).padStart(2, "0")}</span> {s}
          </div>
        ))}
        <span className="cursor">▌</span>
      </div>
      <div className="progress">
        <i style={{ width: `${(step / 9) * 100}%` }} />
      </div>
      {step === 9 ? (
        <Link className="primary" to="/dashboard">
          ВОЙТИ В СИСТЕМУ <ArrowRight size={18} />
        </Link>
      ) : (
        <button className="text-button" onClick={() => setStep(9)}>
          Пропустить загрузку <ArrowRight size={16} />
        </button>
      )}
      <p className="muted">
        Дружеская пародия · Не связана с официальными системами KAZ Minerals
      </p>
    </div>
  );
}
function Title({
  code,
  title,
  sub,
  children,
}: {
  code: string;
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{code}</div>
        <h1>
          {title}
          <span className="amber">.</span>
        </h1>
        <p>{sub}</p>
      </div>
      {children}
    </div>
  );
}
function PanelTitle({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="panel-title">
      <span>{label}</span>
      <small>{tag || "LIVE"}</small>
    </div>
  );
}
function Tank({
  density = 68,
  chaos = 0,
}: {
  density?: number;
  chaos?: number;
}) {
  return (
    <svg
      className={"tank " + (chaos > 60 ? "chaotic" : "")}
      viewBox="0 0 660 340"
      role="img"
      aria-label={`Сгуститель: условное сгущение ${density}%`}
    >
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#38404a" />
          <stop offset=".5" stopColor="#151e27" />
          <stop offset="1" stopColor="#303a42" />
        </linearGradient>
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#b99031" stopOpacity=".7" />
          <stop offset="1" stopColor="#523a15" stopOpacity=".7" />
        </linearGradient>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M30 0H0V30"
            fill="none"
            stroke="#94a3b8"
            strokeOpacity=".065"
          />
        </pattern>
      </defs>
      <rect width="660" height="340" fill="url(#grid)" />
      <path
        d="M50 270 330 330 610 270M50 240 330 300 610 240"
        fill="none"
        stroke="#43534b"
        strokeOpacity=".3"
      />
      <path
        d="M155 181v81M505 181v81M250 223v65M410 223v65"
        stroke="#3b4853"
        strokeWidth="8"
      />
      <path
        d="M112 120v80C112 275 548 275 548 200v-80"
        fill="url(#metal)"
        stroke="#667078"
      />
      <path
        d={`M114 ${206 - density * 0.48} Q330 ${335 - density * 0.48} 546 ${206 - density * 0.48} V200 C546 275 114 275 114 200Z`}
        fill="#ae8030"
        opacity=".32"
      />
      <ellipse
        cx="330"
        cy="122"
        rx="218"
        ry="71"
        fill="#0e151b"
        stroke="#8b969e"
        strokeWidth="2"
      />
      <ellipse cx="330" cy="127" rx="207" ry="62" fill="url(#liquid)" />
      <g className="tank-rings" fill="none" stroke="#dfb351" strokeOpacity=".4">
        <ellipse cx="330" cy="127" rx="168" ry="49" />
        <ellipse cx="330" cy="127" rx="113" ry="32" />
        <ellipse cx="330" cy="127" rx="56" ry="16" />
      </g>
      <g className="particles">
        {Array.from({ length: 24 }, (_, i) => (
          <circle
            key={i}
            cx={145 + ((i * 67) % 370)}
            cy={103 + ((i * 23) % 48)}
            r={1 + density / 40}
            fill="#ffcf66"
            opacity={0.35 + (i % 3) * 0.15}
          />
        ))}
      </g>
      <path
        d="M115 116 327 53 545 116 330 173Z"
        fill="none"
        stroke="#65717c"
        strokeWidth="4"
      />
      <path d="M327 53v76M330 129v44" stroke="#b7bec3" strokeWidth="7" />
      <path d="M310 60h39v-23h-39Z" fill="#ffb800" />
      <path d="M290 42h78" stroke="#b6bfc7" strokeWidth="4" />
      <path
        d="M100 116 330 187 559 116"
        fill="none"
        stroke="#b7c0c8"
        strokeWidth="5"
      />
      <path
        d="M130 134v21m23-14v21m24-13v21m24-13v21m24-14v21m25-13v21m24-14v21m24-13v21m24-13v21m24-13v21m24-29v21m24-29v21m24-29v21m24-29v21m24-29v21m24-29v21m24-29v21m24-29v21"
        stroke="#a2adb4"
        strokeWidth="1"
      />
      <path
        d="M110 139 330 210 552 139"
        fill="none"
        stroke="#6d7b86"
        strokeWidth="2"
      />
      <path d="M330 187v37" stroke="#99a5ae" strokeWidth="4" />
      <rect x="315" y="208" width="30" height="24" rx="2" fill="#ffb800" />
      <text x="330" y="224" fontSize="9" textAnchor="middle" fill="#0b1016">
        Р-01
      </text>
      <path
        d="M40 58h70l40 40M620 57h-65l-30 45M607 281h-80l-27-43"
        fill="none"
        stroke="#687581"
        strokeWidth="1"
      />
      <text x="33" y="48" fill="#8e9ba8" fontSize="9" letterSpacing="2">
        ВЗГЛЯД РУСИ
      </text>
      <text x="540" y="45" fill="#00e676" fontSize="9">
        СИСТЕМА СТАБИЛЬНА
      </text>
      <text x="548" y="297" fill="#8e9ba8" fontSize="9">
        СГУСТИТЕЛЬ Р-01
      </text>
    </svg>
  );
}
function Sparkline({ index = 0 }: { index?: number }) {
  return (
    <svg
      viewBox="0 0 220 45"
      preserveAspectRatio="none"
      className="sparkline"
      aria-hidden="true"
    >
      <path
        d={`M0 40 ${Array.from({ length: 23 }, (_, i) => `L${i * 10} ${35 - Math.sin(i * 1.8 + index) * 6 - i * 0.9}`).join(" ")}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Dashboard() {
  const { unlock, toast, beep } = useApp();
  const [alarm, setAlarm] = useState(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((s) => s + 1), 4200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!alarm) return;
    const t = setTimeout(() => setAlarm((s) => (s < 4 ? s + 1 : 0)), 1500);
    return () => clearTimeout(t);
  }, [alarm]);
  return (
    <>
      <Title
        code="ОПЕРАЦИОННЫЙ МОДУЛЬ / 01"
        title="Центр управления"
        sub="Всё под контролем. Потому что Руся на смене."
      >
        <div className="shift">
          <i className="dot" /> СМЕНА АКТИВНА <span>№ 1993</span>
        </div>
      </Title>
      <section className="hero panel">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-square" /> ОБЪЕКТ ОБНАРУЖЕН
          </div>
          <h2>
            Некоторые управляют
            <br />
            процессом.
            <br />
            <span>Руся — реальностью.</span>
          </h2>
          <p>
            Легендарный аппаратчик. Наставник поколений.
            <br />
            Человек, которого слушается даже пульпа.
          </p>
          <Link className="primary" to="/dossier">
            Открыть досье <ArrowUpRight size={17} />
          </Link>
          <div className="hero-code">
            ОБЪЕКТ: РУСЯ-1993 <span>// ДОСТУП РАЗРЕШЁН</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="hero-year">1993</div>
          <div className="hero-emblem">
            <Shield strokeWidth={0.7} />
            <span>Р</span>
            <small>ЛЕГЕНДА СГУЩЕНИЯ</small>
          </div>
          <span className="coordinate">48° N / 68° E · LEGEND LOCATED</span>
          <div className="hero-tag">
            <i className="dot" /> ПРОФЕССИОНАЛИЗМ НЕ ПОДДАЁТСЯ ИЗМЕРЕНИЮ
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {[
          ["ПРОФЕССИОНАЛИЗМ", "999", "%", "+∞ к стандарту"],
          ["АВТОРИТЕТ СРЕДИ СГУСТИТЕЛЕЙ", "МАКСИМУМ", "", "Выше только Руся"],
          ["КОЭФФИЦИЕНТ ЛЕГЕНДАРНОСТИ", "∞", "", "Предел не обнаружен"],
          ["РУСЯ ВСЁ ЗНАЕТ", "100", "%", "Подтверждено пульпой"],
        ].map(([label, num, unit, desc], i) => (
          <div className="stat panel" key={label}>
            <span className="stat-label">
              {label}
              <Activity size={13} />
            </span>
            <div className={"stat-value " + (i === 1 ? "word" : "")}>
              {num}
              <small>{unit}</small>
            </div>
            <div className="stat-bottom">
              <span>
                <i className="dot" />
                {desc}
              </span>
              <Sparkline index={i} />
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel monitor">
          <PanelTitle label="МОНИТОРИНГ СГУЩЕНИЯ" tag="● ПРЯМОЙ ЭФИР" />
          <div className="monitor-top">
            <div>
              <small>ОБЪЕКТ Р-01</small>
              <h3>Сгуститель под присмотром</h3>
            </div>
            <span className="pill">БОЖЕСТВЕННЫЙ КОНТРОЛЬ</span>
          </div>
          <Tank />
          <div className="monitor-bottom">
            <span>
              <i className="dot" /> ПУЛЬПА ВЕДЁТ СЕБЯ ПРИЛИЧНО
            </span>
            <Link to="/simulator">
              В симулятор <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <section className="panel events">
          <PanelTitle label="ЖУРНАЛ СОБЫТИЙ" tag="СИСТЕМА" />
          {[
            [
              "Система стабильна",
              "Руся посмотрел на сгуститель. Вопросов больше нет.",
            ],
            ["Авторитет подтверждён", "Флокулянт работает из уважения."],
            [
              "Легенда в сети",
              "Руслан приступил к спасению мировой индустрии.",
            ],
            ["Обновление протокола", "Физика согласовала изменения с Русей."],
          ].map(([title, body], i) => (
            <div className="event" key={title}>
              <span className={"event-icon e" + i}>
                {i === 0 ? (
                  <Check size={14} />
                ) : i === 1 ? (
                  <Zap size={14} />
                ) : (
                  <Radio size={14} />
                )}
              </span>
              <div>
                <small>{`0${(tick + i) % 10}:19:93`}</small>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            </div>
          ))}
          <div className="terminal-foot">
            <span>›</span> Ожидание указаний легенды
            <span className="cursor">_</span>
          </div>
        </section>
      </div>
      <div className="bottom-grid">
        <Link className="panel quick" to="/mentor">
          <span className="quick-icon">
            <Radio />
          </span>
          <div>
            <h3>Нужна помощь наставника?</h3>
            <p>Он, скорее всего, уже всё объяснял.</p>
          </div>
          <ArrowUpRight />
        </Link>
        <button
          className="emergency panel"
          onClick={() => {
            setAlarm(1);
            beep(140);
            toast("Учебная шуточная авария запущена");
          }}
        >
          <Zap size={20} />
          <div>
            <strong>ЭКСТРЕННАЯ СИТУАЦИЯ</strong>
            <span>Когда пульпа забыла, кто здесь главный</span>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>
      {alarm > 0 && (
        <div
          className={"alarm-overlay " + (alarm === 4 ? "resolved" : "")}
          role="alert"
        >
          <Zap size={45} />
          <small>ВЫМЫШЛЕННАЯ АВАРИЯ · ТРЕНИРОВОЧНЫЙ ПРОТОКОЛ</small>
          <h2>
            {
              [
                "",
                "КРИТИЧЕСКИЙ УРОВЕНЬ НЕСГУЩЕНИЯ!",
                "ТРЕБУЕТСЯ РУСЯ!",
                "ПОДКЛЮЧЕНИЕ ЛЕГЕНДЫ…",
                "АВАРИЯ УСТРАНЕНА.",
              ][alarm]
            }
          </h2>
          <p>
            {alarm === 4
              ? "РУСЯ ПРОСТО ПОСМОТРЕЛ НА СГУСТИТЕЛЬ"
              : "Сохраняйте спокойствие. Пульпа уже извиняется."}
          </p>
          <button
            onClick={() => {
              setAlarm(0);
              unlock("call");
            }}
          >
            Вернуться в систему
          </button>
        </div>
      )}
    </>
  );
}
const docs = [
  [
    "Документ №1993",
    "Почему пульпа боится Русю",
    "Пульпа однажды попыталась не сгуститься. Руся поднял бровь. С тех пор у пульпы безупречная дисциплина. Дело закрыто за отсутствием несгущения.",
  ],
  [
    "Протокол №28",
    "Рождение легенды",
    "28 декабря 1993 года в мире стало на одного наставника больше. Сгустители этого ещё не знали. Но уже интуитивно работали лучше.",
  ],
  [
    "Секретный отчёт",
    "Руся снова оказался прав",
    "Комиссия проверила 1993 случая. В 1993 случаях Руслан оказался прав. В контрольном случае Руслан был в отпуске, но тоже оказался прав.",
  ],
];
function Dossier() {
  const { date, setModal, unlock, toast } = useApp();
  const [doc, setDoc] = useState<number | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (hold.current) clearTimeout(hold.current);
  };
  useEffect(() => () => cancel(), []);
  return (
    <>
      <Title
        code="АРХИВ / 02 · ГРИФ СЕКРЕТНО"
        title="Досье легенды"
        sub="Некоторые документы лучше читать с уважением."
      />
      <div className="dossier-grid">
        <section className="panel identity">
          <span className="classified">РАССЕКРЕЧЕНО ДЛЯ СВОИХ</span>
          <div className="identity-symbol">
            <Shield size={110} strokeWidth={0.8} />
            <b>Р</b>
          </div>
          <div className="eyebrow">ОБЪЕКТ: РУСЯ-1993</div>
          <h2>
            Руслан<span className="amber">.</span>
          </h2>
          <p>Человек, которого слушается пульпа.</p>
          <dl>
            {[
              ["Позывной", "РУСЯ"],
              ["Дата рождения", "28.12.1993"],
              [
                "Возраст",
                `${date.age} ${date.age % 10 === 1 && date.age % 100 !== 11 ? "год" : date.age % 10 >= 2 && date.age % 10 <= 4 && !(date.age % 100 >= 12 && date.age % 100 <= 14) ? "года" : "лет"}`,
              ],
              ["Место работы", "KAZ Minerals"],
              ["Специализация", "Аппаратчик сгустителей"],
              ["Уровень доступа", "ЛЕГЕНДАРНЫЙ"],
            ].map(([a, b]) => (
              <div key={a}>
                <dt>{a}</dt>
                <dd>{b}</dd>
              </div>
            ))}
          </dl>
          <button
            className="seal"
            onPointerDown={() => {
              cancel();
              hold.current = setTimeout(() => {
                unlock("wisdom");
                toast("Лучший ответ наставника — многозначительное молчание.");
              }, 2000);
            }}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                unlock("wisdom");
              }
            }}
          >
            ПЕЧАТЬ ЛЕГЕНДЫ · УДЕРЖИВАТЬ 2 СЕК
          </button>
        </section>
        <div>
          <section className="panel powers">
            <PanelTitle label="ОСОБЫЕ СПОСОБНОСТИ" tag="4 / 4" />
            {[
              "Сгущение одним взглядом",
              "Телепатическая связь с флокулянтом",
              "Обнаружение неисправностей на расстоянии",
              "Бесконечный запас наставнической мудрости",
            ].map((s, i) => (
              <div className="power" key={s}>
                <Zap size={20} />
                <span>
                  <small>СПОСОБНОСТЬ 0{i + 1}</small>
                  <h3>{s}</h3>
                </span>
                <Check size={16} />
              </div>
            ))}
          </section>
          <section className="panel documents">
            <PanelTitle label="СЕКРЕТНЫЕ ДОКУМЕНТЫ" tag="АРХИВ" />
            {docs.map(([a, b], i) => (
              <button key={a} onClick={() => setDoc(i)}>
                <FileLock2 size={22} />
                <span>
                  <small>{a}</small>
                  <strong>{b}</strong>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
            <button
              className="secret-document"
              onClick={() => {
                unlock("secret");
                toast("Личный состав: ученик легенды. Допуск подтверждён.");
              }}
            >
              <Lock size={13} /> Служебный люк 1993 · Только для любопытных
            </button>
          </section>
          <section className="panel birthday-card">
            <Gift size={30} />
            <div>
              <small>ДО СЛЕДУЮЩЕГО ДНЯ РОЖДЕНИЯ</small>
              <h3>
                {date.birthday ? "Сегодня день легенды!" : `${date.days} дней`}
              </h3>
            </div>
            <button
              className="text-button"
              onClick={() => setModal("birthday")}
            >
              Праздничный режим <ArrowUpRight size={16} />
            </button>
          </section>
        </div>
      </div>
      {doc !== null && (
        <Modal close={() => setDoc(null)}>
          <small>{docs[doc][0]} · СОВЕРШЕННО СЕКРЕТНО</small>
          <h2>{docs[doc][1]}</h2>
          <p>{docs[doc][2]}</p>
          <div className="stamp">ПОДТВЕРЖДЕНО РУСЕЙ</div>
        </Modal>
      )}
    </>
  );
}
const funny = [
  "Пульпа испугалась Русю.",
  "Флокулянт работает из уважения.",
  "Сгуститель достиг просветления.",
  "Руслан спас производство одним взглядом.",
  "Физика временно уступила авторитету Руси.",
];
function Simulator() {
  const { p, setP, unlock, beep } = useApp();
  const g = p.game;
  const [message, setMessage] = useState(
    "Смена началась. Пульпа пока не в курсе.",
  );
  function act(action: string) {
    const next = play(g, action, p.difficulty);
    setP((v: Progress) => ({ ...v, game: next }));
    beep(action === "alarm" ? 180 : 550);
    setMessage(funny[Math.floor(Math.random() * funny.length)]);
    if (next.floc >= 3) unlock("floc");
    if (next.combo === "tfr") unlock("combo");
    if (won(next)) {
      unlock("pulp");
      if (p.difficulty === 3) unlock("century");
      setMessage("СМЕНА ЗАВЕРШЕНА. Сгуститель просит автограф!");
    }
  }
  return (
    <>
      <Title
        code="УЧЕБНЫЙ МОДУЛЬ / 03"
        title="Симулятор сгустителя"
        sub="Все параметры — игровые. Физика здесь работает по договорённости."
      />
      <div className="sim-layout">
        <section className="panel sim-tank">
          <PanelTitle label="СГУСТИТЕЛЬ Р-01" tag={`ХОД ${g.moves}`} />
          <Tank density={g.density} chaos={g.chaos} />
          <div className="game-message" role="status">
            <Terminal size={18} />
            {message}
          </div>
          <div className="game-controls">
            <button className="primary" onClick={() => act("thicken")}>
              <FlaskConical size={18} /> СГУСТИТЬ
            </button>
            <button onClick={() => act("floc")}>
              <Sparkles size={17} /> ДОБАВИТЬ ФЛОКУЛЯНТ
            </button>
            <button onClick={() => act("rusya")}>
              <Radio size={17} /> ПОЗВАТЬ РУСЮ
            </button>
            <button className="danger" onClick={() => act("alarm")}>
              <Zap size={17} /> АВАРИЙНАЯ КНОПКА
            </button>
          </div>
        </section>
        <div className="sim-side">
          <section className="panel padded">
            <PanelTitle label="ПАРАМЕТРЫ СМЕНЫ" />
            {[
              ["Уровень сгущения", g.density],
              ["Стабильность процесса", g.stability],
              ["Авторитет Руси", g.authority],
              ["Уровень хаоса", g.chaos],
            ].map(([s, n]) => (
              <div className="meter" key={s}>
                <span>
                  {s}
                  <b>{n}%</b>
                </span>
                <div
                  className={"progress " + (s === "Уровень хаоса" ? "red" : "")}
                >
                  <i style={{ width: `${n}%` }} />
                </div>
              </div>
            ))}
          </section>
          <section className="panel padded">
            <div className="eyebrow">ЗАДАНИЕ СМЕНЫ</div>
            <h3>
              {won(g) ? "Идеальное сгущение ✓" : "Заслужить уважение пульпы"}
            </h3>
            <ul className="objectives">
              <li className={g.density >= 90 ? "complete" : ""}>
                Сгущение ≥ 90% {g.density >= 90 && <Check size={14} />}
              </li>
              <li className={g.stability >= 70 ? "complete" : ""}>
                Стабильность ≥ 70%
              </li>
              <li className={g.chaos <= 20 ? "complete" : ""}>Хаос ≤ 20%</li>
            </ul>
            <label className="select-label">
              Сложность
              <select
                value={p.difficulty}
                onChange={(e) => {
                  setP((v: Progress) => ({
                    ...v,
                    difficulty: Number(e.target.value),
                    game: { ...initialGame },
                  }));
                  setMessage("Новая сложность. Новая смена. Тот же Руся.");
                }}
              >
                <option value={1}>Стажёр</option>
                <option value={2}>Аппаратчик</option>
                <option value={3}>Легенда</option>
              </select>
            </label>
            <p className="muted">
              Сложность усиливает хаос и потерю стабильности при сгущении.
            </p>
            <button
              className="text-button"
              onClick={() => {
                setP((v: Progress) => ({ ...v, game: { ...initialGame } }));
                setMessage(
                  "Смена перезапущена. Пульпа делает вид, что ничего не было.",
                );
              }}
            >
              <RotateCcw size={16} /> Новая смена
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
const replies = [
  "Он уже объяснял.",
  "Надо было слушать с первого раза.",
  "Руся наблюдает за тобой.",
  "Ошибка 404: терпение наставника не найдено.",
  "Руслан занят спасением мировой индустрии сгущения.",
];
function Mentor() {
  const { unlock, beep } = useApp();
  const [calls, setCalls] = useState(0);
  const [state, setState] = useState<"idle" | "calling" | "answer" | "rage">(
    "idle",
  );
  const [reply, setReply] = useState("Канал открыт. Наставник где-то рядом.");
  const last = useRef(0);
  useEffect(() => {
    document.body.classList.toggle("rage-mode", state === "rage");
    return () => document.body.classList.remove("rage-mode");
  }, [state]);
  useEffect(() => {
    if (state === "calling") {
      const t = setTimeout(() => {
        setReply(replies[Math.floor(Math.random() * replies.length)]);
        setState("answer");
      }, 1100);
      return () => clearTimeout(t);
    }
    if (state === "rage") {
      const t = setTimeout(() => {
        setState("idle");
        setCalls(0);
        setReply("Терпение восстановлено. На этот раз слушай внимательно.");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [state]);
  function call() {
    unlock("call");
    beep(420);
    const n = Date.now() - last.current < 15000 ? calls + 1 : 1;
    last.current = Date.now();
    setCalls(n);
    if (n >= 5) {
      setState("rage");
      unlock("patience");
      beep(120);
    } else setState("calling");
  }
  return (
    <>
      <Title
        code="ЗАЩИЩЁННЫЙ КАНАЛ / 04"
        title="Связь с наставником"
        sub="Вызов имитируется. Реальные наставники не пострадают."
      />
      <section
        className={"panel mentor-terminal " + (state === "rage" ? "rage" : "")}
      >
        <div className="terminal-top">
          <span>
            <i className="dot" /> КАНАЛ 19.93 / ШИФРОВАНИЕ: УВАЖЕНИЕ
          </span>
          <span>РУСЯ ONLINE</span>
        </div>
        <div className="signal-circle">
          <div className="signal-ring" />
          <Radio size={70} strokeWidth={1} />
        </div>
        <div className="eyebrow">
          {state === "calling"
            ? "ВХОДЯЩИЙ ВЫМЫШЛЕННЫЙ ЗВОНОК…"
            : state === "rage"
              ? "УРОВЕНЬ ТЕРПЕНИЯ РУСИ: 0%"
              : "ПРЯМАЯ ЛИНИЯ С ЛЕГЕНДОЙ"}
        </div>
        <h2 aria-live="polite">
          {state === "rage"
            ? "ТЫ ЧТО, ОПЯТЬ НИЧЕГО НЕ ПОНЯЛ?!"
            : state === "calling"
              ? "Подключаем авторитет…"
              : reply}
        </h2>
        <div className="wave" aria-hidden="true">
          {Array.from({ length: 35 }, (_, i) => (
            <i
              key={i}
              style={{
                height: 8 + ((i * 17) % 45),
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
        <button
          className="primary call-button"
          disabled={state === "calling" || state === "rage"}
          onClick={call}
        >
          <Phone size={20} /> ВЫЗВАТЬ РУСЮ
        </button>
        <p className="muted">
          Совет: наставник ценит последовательность. Но у всего есть предел.
        </p>
        <div className="call-counter">
          ВЫЗОВОВ В СЕРИИ <b>{calls.toString().padStart(2, "0")}</b> / 05
        </div>
      </section>
    </>
  );
}
const questions = [
  {
    q: "Что делать, если сгуститель перестал сгущать?",
    a: [
      "Проверить, не обиделась ли пульпа",
      "Позвать Русю",
      "Объявить сгустителю выговор",
      "Вежливо попросить сгущаться",
    ],
    correct: 1,
  },
  {
    q: "Почему флокулянт работает без выходных?",
    a: [
      "Из уважения к Русе",
      "Копит на отпуск",
      "Боится календаря",
      "Ему нравится коллектив",
    ],
    correct: 0,
  },
  {
    q: "Как измерить авторитет наставника?",
    a: [
      "Линейкой",
      "По громкости рации",
      "Никак. Прибор зашкаливает",
      "Попросить пульпу проголосовать",
    ],
    correct: 2,
  },
  {
    q: "Что Руся делает перед устранением вымышленной аварии?",
    a: [
      "Обновляет гороскоп",
      "Советуется со сгустителем",
      "Пишет пульпе письмо",
      "Просто смотрит",
    ],
    correct: 3,
  },
  {
    q: "Главный принцип ученика легенды?",
    a: [
      "Нажимать все кнопки одновременно",
      "Слушать наставника и говорить спасибо",
      "Прятаться за флокулянтом",
      "Делать серьёзное лицо",
    ],
    correct: 1,
  },
];
function Academy() {
  const { unlock, party } = useApp();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const done = index === 5;
  const score = answers.reduce(
    (sum, a, i) => sum + (a === questions[i].correct ? 1 : 0),
    0,
  );
  function next() {
    if (selected === null) return;
    setAnswers((a) => [...a, selected]);
    setSelected(null);
    setIndex((i) => i + 1);
    if (index === 4) {
      unlock("student");
      party();
    }
  }
  return (
    <>
      <Title
        code="ОБРАЗОВАТЕЛЬНЫЙ ПРОТОКОЛ / 05"
        title="Академия Руси"
        sub="Пять вопросов. Один наставник. Бесконечная мудрость."
      />
      <section className="panel academy">
        <div className="academy-top">
          <GraduationCap size={27} />
          <span>
            {done ? "АТТЕСТАЦИЯ ЗАВЕРШЕНА" : `ВОПРОС ${index + 1} ИЗ 5`}
          </span>
          <span>АКАДЕМИЯ / 1993</span>
        </div>
        <div className="progress">
          <i style={{ width: `${(index / 5) * 100}%` }} />
        </div>
        {done ? (
          <div className="certificate">
            <Trophy size={64} />
            <div className="eyebrow">СЕРТИФИКАТ № Р-1993</div>
            <h2>СЕРТИФИЦИРОВАННЫЙ СПЕЦИАЛИСТ АКАДЕМИИ РУСИ</h2>
            <p>
              Результат: {score} из 5.{" "}
              {score === 5
                ? "Наставник одобрительно поднял бровь."
                : "Курс пройден. Руся рекомендует ещё раз послушать наставника."}
            </p>
            <button className="primary" onClick={() => window.print()}>
              Сохранить сертификат / печать
            </button>
            <button
              className="text-button"
              onClick={() => {
                setIndex(0);
                setAnswers([]);
                setSelected(null);
              }}
            >
              <RotateCcw size={16} /> Пройти ещё раз
            </button>
          </div>
        ) : (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="quiz"
          >
            <div className="eyebrow">АТТЕСТАЦИЯ БУДУЩЕЙ ЛЕГЕНДЫ</div>
            <h2>{questions[index].q}</h2>
            <div className="answers">
              {questions[index].a.map((a, i) => (
                <button
                  className={selected === i ? "selected" : ""}
                  onClick={() => setSelected(i)}
                  key={a}
                >
                  <span>{"ABCD"[i]}</span>
                  {a}
                  {selected === i && <Check size={17} />}
                </button>
              ))}
            </div>
            <button
              className="primary"
              disabled={selected === null}
              onClick={next}
            >
              {index === 4 ? "Получить сертификат" : "Следующий вопрос"}
              <ArrowRight size={17} />
            </button>
          </motion.div>
        )}
      </section>
      <p className="footnote">
        Учебные вопросы шуточные и не заменяют обучение работе с оборудованием.
      </p>
    </>
  );
}
function Achievements() {
  const { p, setModal } = useApp();
  return (
    <>
      <Title
        code="КОЛЛЕКЦИЯ / 06"
        title="Зал достижений"
        sub="Каждая легенда начинается с любопытства."
      >
        <button className="text-button" onClick={() => setModal("reset")}>
          <RotateCcw size={16} /> Сбросить прогресс
        </button>
      </Title>
      <section className="panel achievement-progress">
        <Trophy size={38} />
        <div>
          <small>ВАШ ПУТЬ К ЛЕГЕНДЕ</small>
          <h2>
            {
              p.ids.filter((id: string) =>
                achievements.some((a) => a.id === id),
              ).length
            }{" "}
            <span>/ {achievements.length} достижений</span>
          </h2>
          <div className="progress">
            <i
              style={{
                width: `${(p.ids.length / achievements.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <span className="pill">СОХРАНЯЕТСЯ НА УСТРОЙСТВЕ</span>
      </section>
      <div className="achievement-grid">
        {achievements.map((a, i) => {
          const yes = p.ids.includes(a.id);
          return (
            <article
              key={a.id}
              className={"panel achievement " + (yes ? "unlocked" : "locked")}
            >
              <div className="achievement-icon">
                {yes ? <Trophy size={32} /> : <Lock size={29} />}
              </div>
              <small>
                {yes
                  ? "ПОЛУЧЕНО"
                  : a.hidden
                    ? "СЕКРЕТНОЕ ДОСТИЖЕНИЕ"
                    : `ДОСТИЖЕНИЕ ${String(i + 1).padStart(2, "0")}`}
              </small>
              <h3>{a.hidden && !yes ? "Неизвестная легенда" : a.name}</h3>
              <p>{a.hint}</p>
              {yes && <Check className="badge-check" size={17} />}
            </article>
          );
        })}
      </div>
      <Link to="/final" className="panel final-link">
        <Sparkles size={25} />
        <span>
          <strong>Секретный финал</strong>
          <small>Симулятор + академия + вызов наставника</small>
        </span>
        <span>{finalReady(p.ids) ? "РАЗБЛОКИРОВАН" : "В ПРОЦЕССЕ"}</span>
        <ArrowRight size={20} />
      </Link>
    </>
  );
}
function Final() {
  const { p, party } = useApp();
  const ready = finalReady(p.ids);
  useEffect(() => {
    if (ready) party();
  }, [ready]);
  return (
    <>
      <Title
        code="СЕКРЕТНЫЙ ПРОТОКОЛ / 07"
        title="Рождение легенды"
        sub="Для человека, который оставил след гораздо глубже, чем осадок."
      />
      {ready ? (
        <section className="panel final-certificate">
          <div className="eyebrow">ПОЧЁТНЫЙ СЕРТИФИКАТ · 1993 — ∞</div>
          <div className="medal">
            <Trophy size={55} />
          </div>
          <p>РУСЛАНУ ПРИСВАИВАЕТСЯ ПОЧЁТНОЕ ЗВАНИЕ</p>
          <h2>
            ЛЕГЕНДАРНЫЙ
            <br />
            <span>АППАРАТЧИК СГУСТИТЕЛЕЙ</span>
          </h2>
          <div className="gold-rule" />
          <p>
            За выдающиеся заслуги перед пульпой
            <br />и воспитание будущих поколений аппаратчиков.
          </p>
          <div className="thanks">
            А если без шуток — спасибо,
            <br />
            что был моим наставником, Руся 🤝
          </div>
          <button className="primary" onClick={party}>
            <Sparkles size={18} /> Повторить церемонию
          </button>
          <div className="signature">С УВАЖЕНИЕМ, ТВОЙ БЫВШИЙ УЧЕНИК</div>
        </section>
      ) : (
        <section className="panel final-locked">
          <Lock size={64} />
          <h2>Легендарный допуск требуется</h2>
          <p>Завершите три задания. В конце вас ждёт кое-что личное.</p>
          {[
            ["pulp", "Выполнить задание симулятора", "/simulator"],
            ["student", "Пройти академию", "/academy"],
            ["call", "Позвонить наставнику", "/mentor"],
          ].map(([id, text, path]) => (
            <Link key={id} to={path}>
              {p.ids.includes(id) ? <Check size={20} /> : <Lock size={20} />}
              <span>{text}</span>
              <ArrowRight size={17} />
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
function Birthday() {
  const { date, unlock, party } = useApp();
  const [celebrating, setCelebrating] = useState(false);
  const age = date.birthday ? date.age : date.age + 1;
  return (
    <div className="birthday-content">
      <Gift size={45} />
      <div className="eyebrow">
        {date.birthday
          ? "28 ДЕКАБРЯ · ДЕНЬ ЛЕГЕНДЫ"
          : "ПРЕДПРОСМОТР · БЛИЖАЙШИЙ ДЕНЬ РОЖДЕНИЯ"}
      </div>
      <h2>
        РУСЯ 1993:
        <br />
        ЮБИЛЕЙНОЕ ИЗДАНИЕ
      </h2>
      <h3>
        <span className="birthday-age">{age}</span>{" "}
        {age % 10 === 1 && age % 100 !== 11
          ? "ГОД"
          : age % 10 >= 2 &&
              age % 10 <= 4 &&
              !(age % 100 >= 12 && age % 100 <= 14)
            ? "ГОДА"
            : "ЛЕТ"}{" "}
        НАЗАД ПРОИЗОШЛО СОБЫТИЕ, ИЗМЕНИВШЕЕ МИРОВУЮ ИНДУСТРИЮ СГУЩЕНИЯ
      </h3>
      {[
        "28.12.1993 — дата, когда пульпа впервые почувствовала страх.",
        "Сгустители ещё не знали, кто придёт ими управлять.",
        "Мир был не готов. Но Руся родился.",
        "С ДНЁМ РОЖДЕНИЯ, ЛЕГЕНДА!",
      ].map((s, i) => (
        <motion.p
          key={s}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.65 }}
        >
          {s}
        </motion.p>
      ))}
      {celebrating ? (
        <div className="stamp" role="status">
          ПУЛЬПА СТОЯ АПЛОДИРУЕТ!
          <br />
          ПОЧЁТНАЯ НАГРАДА: ЛЕГЕНДА НА ВСЕ ВРЕМЕНА
        </div>
      ) : (
        <button
          className="primary"
          onClick={() => {
            setCelebrating(true);
            unlock("birth");
            party();
          }}
        >
          <Sparkles size={18} /> ПОЗДРАВИТЬ ЛЕГЕНДУ
        </button>
      )}
      <p className="muted">
        Сейчас Руслану {date.age}. 28 декабря режим включается автоматически по
        дате устройства.
      </p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
