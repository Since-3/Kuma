"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  CreditCard,
  ChevronDown,
  Check,
  ArrowRight,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Play,
  Star,
  MapPin,
  TrendingUp,
  Sliders,
  Bell,
  Activity,
  ArrowUpRight,
  UserCheck,
  Lock,
  CalendarDays,
  Sparkle,
  Zap,
} from "lucide-react";

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  tel: string;
  complaints: string;
  avatar: string;
}

const customersData: Customer[] = [
  {
    id: "1",
    name: "Elena Schmidt",
    email: "elena.schmidt@mail.de",
    tel: "+49 172 1234567",
    complaints:
      "Knieprobleme (Meniskus-OP vor 3 Monaten). Tiefes Beugen im Kniegelenk vermeiden, stattdessen erhöhten Sitz anbieten.",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Elena",
  },
  {
    id: "2",
    name: "Marcus Becker",
    email: "marcus.becker@web.de",
    tel: "+49 160 9876543",
    complaints:
      "Bandscheibenvorfall L5/S1. Starke Rotationen und Hohlrücken meiden. Fokus auf Rumpfstabilität.",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Marcus",
  },
  {
    id: "3",
    name: "Laura Meyer",
    email: "laura.meyer@gmx.de",
    tel: "+49 151 5556677",
    complaints:
      "Schwangerschaft (24. SSW). Keine Bauchlagenübungen, häufige Atempausen, Puls unter 140 bpm halten.",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Laura",
  },
];

interface Trainer {
  id: string;
  name: string;
  avatar: string;
  status: string;
  permissions: {
    createCourses: boolean;
    viewCustomers: boolean;
    managePayouts: boolean;
  };
}

const initialTrainers: Trainer[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
    status: "Aktiv",
    permissions: { createCourses: true, viewCustomers: true, managePayouts: false },
  },
  {
    id: "2",
    name: "Felix Kowalski",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    status: "Aktiv",
    permissions: { createCourses: true, viewCustomers: false, managePayouts: false },
  },
];

// Reusable Scroll-Reveal Component using IntersectionObserver
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transition:
          "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        transform: isVisible ? "translateY(0)" : "translateY(22px)",
        opacity: isVisible ? 1 : 0,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// Animated number counter triggered by IntersectionObserver
interface CountUpProps {
  end: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}
function CountUp({ end, suffix = "", decimals = 0, duration = 2000 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(eased * end);
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [started, end, duration]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  // --- States ---
  const [notification, setNotification] = useState<{ text: string; time: string } | null>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: number;
      top: number;
      color: string;
      dx: string;
      dy: string;
      dr: string;
      delay: number;
      borderRadius: string;
    }>
  >([]);

  // Hero Interactive Course Creator
  const [courseTitle, setCourseTitle] = useState("Vinyasa Flow Yoga");
  const [selectedSport, setSelectedSport] = useState("Yoga");
  const [coursePrice, setCoursePrice] = useState(15);
  const [maxParticipants, setMaxParticipants] = useState(12);
  const [isPublished, setIsPublished] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  // Bento: Room Planner
  const [activeRoom, setActiveRoom] = useState("Studio A");

  // Bento: Trainer Management
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [showPermissionToast, setShowPermissionToast] = useState(false);

  // Bento: Customer search & select
  const [searchCustomer, setSearchCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customersData[0]);

  // Interactive Booking Simulator
  const [bookingStep, setBookingStep] = useState(1);
  const [simulatedCourse, setSimulatedCourse] = useState<{
    name: string;
    price: number;
    trainer: string;
  } | null>(null);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Pricing Toggle
  const [isAnnual, setIsAnnual] = useState(true);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // --- Scroll Tracking for Progress Bar (no state = no re-renders) ---
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollBarRef.current) {
        scrollBarRef.current.style.width = `${(y / total) * 100}%`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse Spotlight & Tilt logic (WOW Hover effect)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -(y - centerY) / 22;
    const rotateY = (x - centerX) / 22;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.006, 1.006, 1.006)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  // Confetti Particle Explosion
  const handleExplode = (clientX: number, clientY: number) => {
    const newParticles = Array.from({ length: 35 }).map(() => ({
      id: Math.random(),
      left: clientX,
      top: clientY,
      color: ["#818cf8", "#c084fc", "#f472b6", "#fbbf24", "#34d399", "#22d3ee"][
        Math.floor(Math.random() * 6)
      ],
      dx: `${(Math.random() - 0.5) * 350}px`,
      dy: `${-Math.random() * 250 - 50}px`,
      dr: `${Math.random() * 720}deg`,
      delay: Math.random() * 0.12,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1600);
  };

  const triggerPublishWithExplosion = (e: React.MouseEvent) => {
    setIsPublished(true);
    setBookingCount(0);
    handleExplode(e.clientX, e.clientY);
  };

  const triggerPaymentWithExplosion = (e: React.MouseEvent) => {
    setIsPaying(true);
    const clientX = e.clientX;
    const clientY = e.clientY;
    setTimeout(() => {
      setIsPaying(false);
      setBookingStep(3);
      handleExplode(clientX, clientY);
    }, 2000);
  };

  // Periodic Notifications to simulate live platform activity
  useEffect(() => {
    const alerts = [
      { text: "Elena S. hat 'Sunrise Vinyasa' bei Yoga Loft gebucht", time: "Gerade eben" },
      { text: "Studio 'Prana Studio' hat sich erfolgreich registriert", time: "Vor 1 Min" },
      { text: "Auszahlung von 1.420 € via Stripe an Studio Vitality gesendet", time: "Vor 3 Min" },
      { text: "Felix K. hat das Trainer-Onboarding abgeschlossen", time: "Vor 5 Min" },
      { text: "Neue Buchung: Reformer Pilates (Tobias W.)", time: "Vor 8 Min" },
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      setNotification(alerts[currentIndex]);
      currentIndex = (currentIndex + 1) % alerts.length;

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }, 8500);

    return () => clearInterval(interval);
  }, []);

  // Simulate bookings rising slowly for the Hero Preview Card
  useEffect(() => {
    if (isPublished) {
      const timer = setInterval(() => {
        setBookingCount((prev) => {
          if (prev < Math.floor(maxParticipants * 0.75)) {
            return prev + 1;
          } else {
            clearInterval(timer);
            return prev;
          }
        });
      }, 1800);
      return () => clearInterval(timer);
    }
  }, [isPublished, maxParticipants]);

  // Handle trainer permission toggle
  const togglePermission = (
    trainerId: string,
    permissionKey: "createCourses" | "viewCustomers" | "managePayouts"
  ) => {
    setTrainers((prev) =>
      prev.map((t) => {
        if (t.id === trainerId) {
          return {
            ...t,
            permissions: {
              ...t.permissions,
              [permissionKey]: !t.permissions[permissionKey],
            },
          };
        }
        return t;
      })
    );
    setShowPermissionToast(true);
    setTimeout(() => setShowPermissionToast(false), 2000);
  };

  // Filter customers based on search
  const filteredCustomers = customersData.filter((c) =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div className="relative min-h-screen text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900 font-sans antialiased">
      {/* White base — waves accent subtly */}
      <div className="fixed inset-0 -z-30 bg-[#FAFAFA] pointer-events-none" />

      {/* Scroll Progress Indicator */}
      <div
        ref={scrollBarRef}
        className="fixed top-0 left-0 h-0.5 bg-linear-to-r from-yellow via-amber-400 to-amber-500 z-50"
        style={{ width: "0%" }}
      />

      <style jsx global>{`
        .dot-matrix {
          background-image: radial-gradient(rgba(15, 23, 42, 0.05) 1.2px, transparent 1.2px);
          background-size: 32px 32px;
        }
        @keyframes float-gentle {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        @keyframes float-gentle-reverse {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(12px) rotate(-1.5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        @keyframes circular-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes particle-burst {
          0% {
            transform: translate3d(0, 0, 0) scale(1.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--dx), var(--dy), 0) scale(0) rotate(var(--dr));
            opacity: 0;
          }
        }
        @keyframes text-reveal {
          0% {
            transform: translateY(40px);
            opacity: 0;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }
        @keyframes drift-a {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(80px, -60px) scale(1.04);
          }
          50% {
            transform: translate(40px, 80px) scale(0.97);
          }
          75% {
            transform: translate(-60px, 30px) scale(1.02);
          }
        }
        @keyframes drift-b {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(-70px, 50px) scale(0.97);
          }
          50% {
            transform: translate(60px, -70px) scale(1.04);
          }
          75% {
            transform: translate(30px, 60px) scale(0.98);
          }
        }
        @keyframes drift-c {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(-50px, -80px) scale(1.03);
          }
          66% {
            transform: translate(70px, 40px) scale(0.96);
          }
        }
        .animate-drift-a {
          animation: drift-a 28s ease-in-out infinite;
        }
        .animate-drift-b {
          animation: drift-b 35s ease-in-out infinite;
        }
        .animate-drift-c {
          animation: drift-c 22s ease-in-out infinite;
        }

        @keyframes gradient-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-flow {
          background-size: 250% auto;
          animation: gradient-flow 5s ease infinite;
        }

        @keyframes hero-glow-pulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.06);
          }
        }
        .animate-hero-glow {
          animation: hero-glow-pulse 6s ease-in-out infinite;
        }

        @keyframes aurora-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-aurora {
          animation: aurora-spin 60s linear infinite;
        }

        /* Subtle film-grain / noise for premium depth */
        .noise-layer {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
        }
        .animate-float-gentle {
          animation: float-gentle 12s ease-in-out infinite;
        }
        .animate-float-gentle-reverse {
          animation: float-gentle-reverse 14s ease-in-out infinite;
        }
        .animate-circular-rotate {
          animation: circular-rotate 20s linear infinite;
        }
        .animate-reveal {
          animation: text-reveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .reveal-delay-1 {
          animation-delay: 0.15s;
        }
        .reveal-delay-2 {
          animation-delay: 0.3s;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(70px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow:
              0 0 40px 0px rgba(244, 192, 12, 0.15),
              0 0 0 1.5px rgba(244, 192, 12, 0.3);
          }
          50% {
            box-shadow:
              0 0 80px 0px rgba(244, 192, 12, 0.35),
              0 0 0 1.5px rgba(244, 192, 12, 0.55);
          }
        }
        @keyframes count-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-marquee {
          animation: marquee 42s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-count-up {
          animation: count-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Dot Matrix Pattern — subtle */}
      <div className="fixed inset-0 dot-matrix pointer-events-none -z-20 opacity-30" />
      {/* Film grain — premium depth */}
      <div className="noise-layer fixed inset-0 pointer-events-none z-60 opacity-[0.022] mix-blend-overlay" />

      {/* Automatic Moving Wave Blobs — subtle tint on white */}
      <div className="fixed top-[-10%] left-[-12%] w-[65vw] h-[65vw] rounded-full bg-violet-400/12 blur-[110px] pointer-events-none -z-10 animate-drift-a will-change-transform" />
      <div className="fixed top-[28%] right-[-18%] w-[55vw] h-[55vw] rounded-full bg-amber-300/10 blur-[100px] pointer-events-none -z-10 animate-drift-b will-change-transform" />
      <div className="fixed bottom-[-10%] left-[8%] w-[50vw] h-[50vw] rounded-full bg-teal-300/10 blur-[100px] pointer-events-none -z-10 animate-drift-c will-change-transform" />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-6 z-50 max-w-7xl mx-auto px-6">
        <nav className="flex items-center justify-between px-8 py-4 rounded-full backdrop-blur-2xl backdrop-saturate-150 bg-white/55 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white shadow-md">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 lowercase">
              kumasy.
            </span>
          </div>

          <div className="hidden md:flex items-center gap-9 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <a href="#features" className="hover:text-slate-950 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-slate-950 transition-colors">
              Live Buchung
            </a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">
              Preise
            </a>
            <a href="#faq" className="hover:text-slate-950 transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-950 px-3 py-1.5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register/admin"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900 bg-yellow hover:bg-amber-400 transition-all shadow-md shadow-amber-400/20 hover:shadow-lg"
            >
              Starten
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 md:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-6">
        {/* Aurora decorative ring */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none -z-10 opacity-30 animate-aurora">
          <div className="absolute inset-0 rounded-full border border-violet-400/40" />
          <div className="absolute inset-12 rounded-full border border-amber-400/30" />
          <div className="absolute inset-24 rounded-full border border-teal-400/20" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl backdrop-saturate-150 bg-white/55 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>Studio Flow State</span>
            </div>

            <h1 className="text-[2.8rem] sm:text-7xl xl:text-[9rem] font-black tracking-tighter text-slate-950 leading-[0.88] uppercase opacity-0 animate-reveal relative">
              {/* Glow hinter dem Titel */}
              <span className="absolute -z-10 top-1/2 left-0 w-[120%] h-[120%] -translate-y-1/2 bg-amber-300/20 blur-[80px] rounded-full animate-hero-glow pointer-events-none" />
              Bringe <br />
              <span className="font-light text-slate-400">dein</span> <br />
              <span
                className="animate-gradient-flow bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #f4c00c, #fb923c, #f4c00c, #facc15, #f4c00c)",
                }}
              >
                Studio
              </span>{" "}
              <br />
              in Fluss.
            </h1>

            <p className="text-sm text-slate-500 max-w-md leading-relaxed opacity-0 animate-reveal reveal-delay-1 font-medium">
              Verwalte Kurse, plane Räume, buche Trainer und wickle Zahlungen vollautomatisch ab.
              Kumasy ist die minimalistische All-in-One Software für moderne Studios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto opacity-0 animate-reveal reveal-delay-2">
              <Link
                href="/register/admin"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900 bg-yellow hover:bg-amber-400 shadow-xl shadow-amber-400/25 hover:shadow-2xl transition-all group"
              >
                Studio registrieren
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-white/20 hover:bg-white/35 border border-white/40 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-md transition-all"
              >
                Kunden-Demo
                <Play className="w-3 h-3 ml-2 fill-slate-600 text-slate-600" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 opacity-0 animate-reveal reveal-delay-2">
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL & DSGVO
              </span>
              <span className="w-px h-3 bg-slate-200 shrink-0" />
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                Powered by Stripe
              </span>
              <span className="w-px h-3 bg-slate-200 shrink-0" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                14 Tage kostenlos
              </span>
            </div>

            {/* Circular Infinite Rotating Badge */}
            <div className="absolute top-[80%] right-[-100px] hidden xl:block pointer-events-none -z-10">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg
                  className="absolute w-full h-full animate-circular-rotate"
                  viewBox="0 0 100 100"
                >
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text className="text-[7.5px] font-bold uppercase tracking-widest fill-slate-300">
                    <textPath href="#circlePath">KUMASY • FLOW STATE • ALL IN ONE •</textPath>
                  </text>
                </svg>
                <div className="w-8 h-8 rounded-full bg-white/40 border border-white/60 flex items-center justify-center">
                  <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Admin Studio Scheduler (Static 3D Hover spotlight) */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/5 to-indigo-400/5 rounded-3xl blur-3xl -z-10" />

            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative backdrop-blur-2xl backdrop-saturate-150 bg-white/50 border border-white/60 p-6 md:p-8 rounded-4xl shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_40px_rgba(15,23,42,0.05)] overflow-hidden transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_180px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.35),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none max-w-md md:max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-white/30 pb-4">
                <span className="w-2 h-2 rounded-full bg-slate-900/10" />
                <span className="w-2 h-2 rounded-full bg-slate-900/10" />
                <span className="w-2 h-2 rounded-full bg-slate-900/10" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-3 font-mono">
                  Control_Hub_v2
                </span>
              </div>

              {!isPublished ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Controls */}
                  <div className="space-y-5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Simulator
                      </span>
                      <h3 className="text-base font-bold text-slate-950 mt-0.5 uppercase font-sans">
                        Kurs Erstellen
                      </h3>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Kursname
                      </label>
                      <input
                        type="text"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/40 border border-white/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:bg-white/80 transition-all font-medium"
                        placeholder="Kursname"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Sportart
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {["Yoga", "Pilates", "Crossfit", "Spinning"].map((sport) => (
                          <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                              selectedSport === sport
                                ? "bg-slate-900 text-white shadow-xs"
                                : "bg-white/40 text-slate-500 border border-white/40 hover:bg-white"
                            }`}
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        <span>Preis</span>
                        <span className="text-slate-950">€{coursePrice}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        <span>Max. Plätze</span>
                        <span className="text-slate-950">{maxParticipants} Pers.</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>

                    <button
                      onClick={triggerPublishWithExplosion}
                      className="w-full py-3.5 rounded-full bg-slate-950 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Kurs veröffentlichen
                    </button>
                  </div>

                  {/* Preview Container */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 mb-3 uppercase tracking-widest block text-center">
                      Buchungs-Ansicht
                    </span>

                    <div className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md overflow-hidden shadow-xl transition-all duration-500 transform hover:scale-[1.01]">
                      {/* Gradient Header according to selected sport */}
                      <div
                        className={`h-24 flex items-end p-4 transition-all duration-750 ${
                          selectedSport === "Yoga"
                            ? "bg-gradient-to-br from-indigo-100/40 via-violet-100/50 to-indigo-100/30 border-b border-white/60"
                            : selectedSport === "Pilates"
                              ? "bg-gradient-to-br from-pink-100/40 via-rose-100/50 to-rose-100/30 border-b border-white/60"
                              : selectedSport === "Crossfit"
                                ? "bg-gradient-to-br from-slate-200/40 via-slate-100/50 to-slate-200/30 border-b border-white/60"
                                : "bg-gradient-to-br from-sky-100/40 via-blue-100/50 to-sky-100/30 border-b border-white/60"
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200/40 text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                          {selectedSport}
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                            {courseTitle || "Unbenannter Kurs"}
                          </h4>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>Mitte Studio A</span>
                          </div>
                        </div>

                        {/* Trainer Info */}
                        <div className="flex items-center justify-between border-y border-slate-200/40 py-2.5">
                          <div className="flex items-center gap-2">
                            <img
                              className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200/30"
                              src="https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah"
                              alt="Trainer"
                            />
                            <div>
                              <p className="text-[8px] text-slate-400 leading-none">Trainer/in</p>
                              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                                Sarah Jenkins
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-800">€{coursePrice}</span>
                        </div>

                        {/* Booking progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>Freie Plätze</span>
                            <span>{maxParticipants} Plätze</span>
                          </div>
                          <div className="w-full bg-slate-900/5 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-300 h-full rounded-full transition-all duration-300"
                              style={{ width: "0%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Success & Live simulation view */
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                      Kurs Veröffentlicht!
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Der Kurs ist unter deinem Studio-Link live erreichbar:
                    </p>
                    <div className="mt-3 px-4 py-2.5 bg-white/45 border border-white/80 rounded-xl flex items-center gap-2 text-[10px] font-mono text-slate-600">
                      <span>kumasy.de/s/loft/course-{selectedSport.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Simulate Bookings */}
                  <div className="w-full max-w-xs p-5 rounded-2xl bg-white/50 border border-white/60 shadow-xs">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      <span>Live-Auslastung</span>
                      <span className="text-slate-900 font-extrabold animate-pulse">
                        {bookingCount} / {maxParticipants} gebucht
                      </span>
                    </div>
                    <div className="w-full bg-slate-900/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-950 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(bookingCount / maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsPublished(false)}
                      className="px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider transition-all"
                    >
                      Anderer Kurs
                    </button>
                    <a
                      href="#demo"
                      className="px-5 py-2.5 text-[10px] font-bold text-slate-900 bg-yellow hover:bg-amber-400 rounded-full uppercase tracking-widest shadow-md transition-all"
                    >
                      Jetzt Buchen
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="py-5 overflow-hidden border-y border-slate-200/30 bg-white/10 backdrop-blur-sm">
        <div className="flex animate-marquee whitespace-nowrap select-none">
          {[...Array(2)].flatMap((_, arrIdx) =>
            [
              "Kursplanung",
              "Stripe Payments",
              "Trainer-Rechte",
              "Kundenkartei",
              "Raumverwaltung",
              "Live-Buchung",
              "QR-Tickets",
              "DSGVO-konform",
              "99.9% Uptime",
              "Klassen-Analytics",
            ].map((item, i) => (
              <span key={`${arrIdx}-${i}`} className="inline-flex items-center gap-5 mx-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* METRICS SECTION — DARK */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/12 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5">
            {[
              { end: 99.9, suffix: "%", decimals: 1, label: "Verfügbarkeit" },
              { end: 150, suffix: "K+", decimals: 0, label: "Buchungen" },
              { end: 1.5, suffix: "%", decimals: 1, label: "Servicegebühr" },
              { end: 12, suffix: "min", decimals: 0, label: "Setup-Zeit" },
            ].map((m, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="py-14 px-8 flex flex-col items-center text-center group hover:bg-white/3 transition-colors duration-300 cursor-default">
                  <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter group-hover:text-yellow transition-colors duration-500">
                    <CountUp end={m.end} suffix={m.suffix} decimals={m.decimals} />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-3 group-hover:text-slate-400 transition-colors duration-300">
                    {m.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID: CORE FEATURES WITH INTERACTIVE TILES & SCROLL REVEALS */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-20">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50/60 backdrop-blur-xl border border-amber-200/50 px-4 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              Dashboard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 uppercase">
              Dein Studio-Cockpit für absolute Kontrolle
            </h2>
            <p className="text-slate-500 text-sm">
              Excel hat ausgedient. Kumasy vereint alle Aspekte deines Studio-Betriebs in einer
              interaktiven, atemberaubenden Oberfläche.
            </p>
          </div>
        </Reveal>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bento Tile 1: Room & Resource Scheduling (Double Column) */}
          <div className="lg:col-span-2">
            <Reveal delay={100} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-6 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] min-h-[420px] transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_200px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-800">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Raumplaner
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        Konfliktfreie Terminbelegung
                      </p>
                    </div>
                  </div>

                  {/* Room Toggles */}
                  <div className="flex gap-2 mt-6">
                    {["Studio A (Großer Raum)", "Studio B (Kleingruppe)", "Garten (Outdoor)"].map(
                      (roomName) => (
                        <button
                          key={roomName}
                          onClick={() =>
                            setActiveRoom(roomName.split(" ")[0] + " " + roomName.split(" ")[1])
                          }
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                            activeRoom === roomName.split(" ")[0] + " " + roomName.split(" ")[1]
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-white/45 text-slate-500 border border-white/80 hover:bg-white"
                          }`}
                        >
                          {roomName}
                        </button>
                      )
                    )}
                  </div>

                  {/* Schedule view */}
                  <div className="mt-5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200/40 pb-2">
                      <span>Uhrzeit</span>
                      <span>Kurs</span>
                      <span>Trainer</span>
                    </div>

                    {activeRoom.includes("Studio A") && (
                      <>
                        <div className="flex items-center justify-between text-xs py-1 animate-fade-in">
                          <span className="font-mono text-slate-500">08:00 - 09:15</span>
                          <span className="font-bold text-slate-800">Sunrise Hatha Yoga</span>
                          <span className="text-slate-600">Sarah Jenkins</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/20 animate-fade-in">
                          <span className="font-mono text-slate-500">10:00 - 11:30</span>
                          <span className="font-bold text-slate-800">Pränatal Yoga</span>
                          <span className="text-slate-600">Elena Rostova</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/20 animate-fade-in">
                          <span className="font-mono text-slate-500">17:30 - 19:00</span>
                          <span className="font-bold text-slate-800">Slow Vinyasa Flow</span>
                          <span className="text-slate-600">Felix Kowalski</span>
                        </div>
                      </>
                    )}

                    {activeRoom.includes("Studio B") && (
                      <>
                        <div className="flex items-center justify-between text-xs py-1 animate-fade-in">
                          <span className="font-mono text-slate-500">09:00 - 10:00</span>
                          <span className="font-bold text-slate-800">Power Pilates Core</span>
                          <span className="text-slate-600">Sarah Jenkins</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200/20 animate-fade-in">
                          <span className="font-mono text-slate-500">15:00 - 16:00</span>
                          <span className="font-bold text-slate-800">Rückentraining Reha</span>
                          <span className="text-slate-600">Felix Kowalski</span>
                        </div>
                      </>
                    )}

                    {activeRoom.includes("Garten") && (
                      <>
                        <div className="flex items-center justify-between text-xs py-1 animate-fade-in">
                          <span className="font-mono text-slate-500">18:00 - 19:30</span>
                          <span className="font-bold text-slate-800">Outdoor Flow & Med</span>
                          <span className="text-slate-600">Elena Rostova</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-6 pt-4 border-t border-slate-200/40">
                  * Kumasy gleicht Buchungszeiten im Hintergrund automatisch ab.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Bento Tile 2: Stripe Connect Checkout & Fees (Single Column) */}
          <div>
            <Reveal delay={200} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-6 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] min-h-[420px] transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_200px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-800">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Auszahlungen
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        Stripe Integration
                      </p>
                    </div>
                  </div>

                  {/* Earnings widget with animated SVG drawing */}
                  <div className="mt-8 p-5 rounded-2xl bg-slate-950 text-white shadow-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Umsatzverlauf
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-white/10 rounded font-mono">
                        Stripe
                      </span>
                    </div>

                    {/* SVG Graph drawing itself */}
                    <div className="h-16 w-full relative">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <path
                          d="M0 35 Q15 25, 30 28 T60 15 T85 18 T100 5"
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="2.5"
                          strokeDasharray="200"
                          strokeDashoffset="200"
                          style={{
                            animation: "draw-line 2s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s",
                          }}
                        />
                        <path
                          d="M0 35 Q15 25, 30 28 T60 15 T85 18 T100 5 L100 40 L0 40 Z"
                          fill="url(#gradient-chart)"
                          opacity="0.15"
                        />
                        <defs>
                          <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black">€ 4.821,30</p>
                        <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-semibold uppercase tracking-wide">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">+18.4%</span> vs. Vorwoche
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                  Verbinde dein Bankkonto in wenigen Sekunden. Einnahmen aus Online-Buchungen
                  fließen direkt auf dein Konto.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Bento Tile 3: Customer Database with health log (Double Column) */}
          <div className="lg:col-span-2">
            <Reveal delay={100} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-6 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] min-h-[440px] transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_200px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-800">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Kunden & Gesundheit
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        Erfassung gesundheitlicher Indikationen
                      </p>
                    </div>
                  </div>

                  {/* Customer view */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
                    {/* Search & List */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={searchCustomer}
                          onChange={(e) => setSearchCustomer(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white/45 border border-white/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                        />
                      </div>

                      <div className="max-h-[170px] overflow-y-auto space-y-1 pr-1">
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomer(c)}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all ${
                              selectedCustomer.id === c.id
                                ? "bg-slate-900 border-slate-950 text-white"
                                : "bg-white/20 hover:bg-white/50 border-transparent text-slate-800"
                            }`}
                          >
                            <img
                              className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/20"
                              src={c.avatar}
                              alt={c.name}
                            />
                            <div>
                              <p className="text-xs font-bold leading-tight">{c.name}</p>
                              <p
                                className={`text-[9px] leading-none mt-0.5 ${selectedCustomer.id === c.id ? "text-slate-300" : "text-slate-400"}`}
                              >
                                {c.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Details view - Complaints showcase */}
                    <div className="md:col-span-7 rounded-2xl border border-white/60 bg-white/45 backdrop-blur-md p-4 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <img
                              className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/30"
                              src={selectedCustomer.avatar}
                              alt=""
                            />
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {selectedCustomer.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 font-semibold">
                                {selectedCustomer.tel}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded bg-slate-900 text-white uppercase tracking-wider">
                            Aktiv
                          </span>
                        </div>

                        <div className="mt-4 space-y-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-slate-800 animate-pulse" />
                            Medizinische Beschwerden
                          </span>
                          <div className="text-[11px] text-slate-600 bg-white/30 border border-white/60 p-2.5 rounded-xl leading-relaxed transition-all">
                            {selectedCustomer.complaints || "Keine Beschwerden."}
                          </div>
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-400 mt-4 border-t border-slate-200/20 pt-2 font-medium uppercase tracking-wider">
                        * Diskret für Trainer vor Kursbeginn einsehbar.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-6 pt-4 border-t border-slate-200/40">
                  * Konform mit Datenschutzstandards für Gesundheitsdaten.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Bento Tile 4: Employee / Trainer Permissions (Single Column) */}
          <div>
            <Reveal delay={200} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-6 md:p-8 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] min-h-[440px] transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_200px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-800">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Trainer-Rechte
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        Autorisierungen anpassen
                      </p>
                    </div>
                  </div>

                  {/* Trainers interactive list */}
                  <div className="mt-6 space-y-3">
                    {trainers.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-white/30 border border-white/50 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/20"
                            src={t.avatar}
                            alt=""
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {t.name}
                            </p>
                            <span
                              className={`inline-block text-[8px] font-bold uppercase tracking-wider mt-0.5 px-1.5 rounded-full ${
                                t.status === "Aktiv"
                                  ? "bg-slate-900/5 text-slate-700"
                                  : "bg-slate-900/5 text-slate-400"
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        {/* Permissions Grid */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => togglePermission(t.id, "createCourses")}
                            title="Kurse erstellen"
                            className={`p-1.5 rounded-lg border transition-all ${
                              t.permissions.createCourses
                                ? "bg-slate-950 border-slate-950 text-white"
                                : "bg-white/40 border-white/60 text-slate-400 hover:border-slate-350"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => togglePermission(t.id, "viewCustomers")}
                            title="Kunden einsehen"
                            className={`p-1.5 rounded-lg border transition-all ${
                              t.permissions.viewCustomers
                                ? "bg-slate-950 border-slate-950 text-white"
                                : "bg-white/40 border-white/60 text-slate-400 hover:border-slate-350"
                            }`}
                          >
                            <Users className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => togglePermission(t.id, "managePayouts")}
                            title="Auszahlungen verwalten"
                            className={`p-1.5 rounded-lg border transition-all ${
                              t.permissions.managePayouts
                                ? "bg-slate-950 border-slate-950 text-white"
                                : "bg-white/40 border-white/60 text-slate-400 hover:border-slate-350"
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permission feedback toast inside the bento item */}
                {showPermissionToast && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md animate-fade-in flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Gespeichert</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                  Delegiere die Arbeit. Erlaube Trainern, eigene Kurszeiten einzutragen – ohne
                  Einblick in sensible Studio-Finanzen.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WIE FUNKTIONIERT'S — 3-Schritt Flow */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50/60 backdrop-blur-xl border border-amber-200/50 px-4 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              So einfach
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 uppercase">
              In 3 Schritten live
            </h2>
            <p className="text-slate-500 text-sm">
              Vom leeren Tab zur fertigen Buchungsseite — in einer Kaffeepause.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line desktop */}
          <div className="hidden md:block absolute top-14 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-linear-to-r from-transparent via-slate-200/80 to-transparent pointer-events-none" />

          {(
            [
              {
                step: "01",
                icon: <Zap className="w-5 h-5" />,
                title: "Studio registrieren",
                desc: "Konto erstellen, Stripe verbinden, Logo hochladen. In 15 Minuten bist du live — ohne IT-Kenntnisse.",
                badge: "~15 Min",
              },
              {
                step: "02",
                icon: <Users className="w-5 h-5" />,
                title: "Kurse & Team einrichten",
                desc: "Räume anlegen, Trainer einladen, Kurszeiten festlegen. Berechtigungen per Toggle — ohne Schulungen.",
                badge: "~30 Min",
              },
              {
                step: "03",
                icon: <CreditCard className="w-5 h-5" />,
                title: "Kunden buchen, du verdienst",
                desc: "Dein Studio-Link ist sofort buchbar. Stripe übernimmt Zahlungen und Auszahlungen vollautomatisch.",
                badge: "Sofort live",
              },
            ] as {
              step: string;
              icon: React.ReactNode;
              title: string;
              desc: string;
              badge: string;
            }[]
          ).map((s, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-white/50 border border-white/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)]">
                <span className="absolute top-5 right-6 text-[10px] font-black text-slate-200 tracking-widest">
                  {s.step}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-lg">
                  {s.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-[220px]">
                  {s.desc}
                </p>
                <span className="mt-5 inline-flex items-center px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                  {s.badge}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              text: "Kumasy hat unseren Buchungsprozess revolutioniert. Vorher war alles in Excel – jetzt läuft alles vollautomatisch.",
              name: "Nina Hartmann",
              studio: "Prana Studio München",
              avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Nina",
            },
            {
              text: "Die Stripe-Integration hat uns Stunden pro Woche gespart. Unsere Kunden lieben die schnelle Buchungsseite.",
              name: "Thomas Braun",
              studio: "Vitality Crossfit Berlin",
              avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Thomas",
            },
            {
              text: "Endlich ein Tool, das wirklich für Studio-Inhaber gemacht ist. Übersichtlich, schnell und wunderschön anzusehen.",
              name: "Leonie Fischer",
              studio: "Flow Yoga Köln",
              avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Leonie",
            },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="rounded-[28px] bg-white/50 border border-white/60 p-7 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] h-full flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, k) => (
                      <Star key={k} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/40">
                  <img src={t.avatar} className="w-8 h-8 rounded-full bg-slate-100" alt={t.name} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t.studio}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* INTERACTIVE DEMO: FULL BOOKING PROCESS */}
      <section id="demo" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-indigo-200/10 blur-3xl pointer-events-none" />

        <Reveal>
          <div className="backdrop-blur-2xl backdrop-saturate-150 bg-white/50 border border-white/60 rounded-4xl p-8 md:p-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Description & Instructions */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 border border-white/60 px-4 py-1.5 rounded-full">
                    Kunden-Perspektive
                  </span>

                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 mt-4 leading-tight uppercase">
                    Die modernste Buchungsseite.
                  </h2>

                  <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                    Deine Kunden erhalten eine extrem schnelle, responsive Web-App. Ohne
                    App-Download, direkt aus dem Browser. Sie wählen Termine, bezahlen sicher via
                    Stripe und erhalten sofort ihr Ticket.
                  </p>
                </div>

                {/* Progress Steps Indicators */}
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Kurs wählen", desc: "Wähle dein Wunsch-Workout" },
                    { step: 2, title: "Daten eingeben", desc: "Sichere Bezahlung via Stripe" },
                    { step: 3, title: "Ticket erhalten", desc: "QR-Code & Buchungsdaten" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          bookingStep >= s.step
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-slate-900/5 text-slate-400"
                        }`}
                      >
                        {s.step}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold uppercase tracking-wider leading-none ${bookingStep >= s.step ? "text-slate-900" : "text-slate-400"}`}
                        >
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {bookingStep > 1 && (
                  <button
                    onClick={() => {
                      setBookingStep(1);
                      setSimulatedCourse(null);
                    }}
                    className="w-fit px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 text-[10px] font-bold uppercase tracking-widest rounded-full bg-white transition-all shadow-xs"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>

              {/* Right Column: Active Interactive Simulator Frame */}
              <div className="lg:col-span-7">
                <div className="bg-[#FAF9F6]/80 border border-slate-200/40 rounded-3xl p-6 min-h-[380px] shadow-inner flex flex-col justify-center">
                  {/* STEP 1: CHOOSE A COURSE */}
                  {bookingStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                        Auswahl
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Course A */}
                        <button
                          onClick={() => {
                            setSimulatedCourse({
                              name: "Slow Flow Vinyasa",
                              price: 15,
                              trainer: "Sarah Jenkins",
                            });
                            setBookingStep(2);
                          }}
                          className="p-4 rounded-2xl bg-white border border-slate-200/50 hover:border-slate-900 hover:shadow-xs text-left transition-all group"
                        >
                          <span className="px-2 py-0.5 bg-slate-900/5 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider">
                            Yoga
                          </span>
                          <h4 className="font-bold text-slate-900 mt-2 text-sm">
                            Slow Flow Vinyasa
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Sarah Jenkins</p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              3 Plätze
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 group-hover:underline">
                              €15,00
                            </span>
                          </div>
                        </button>

                        {/* Course B */}
                        <button
                          onClick={() => {
                            setSimulatedCourse({
                              name: "Reformer Pilates Core",
                              price: 22,
                              trainer: "Sarah Jenkins",
                            });
                            setBookingStep(2);
                          }}
                          className="p-4 rounded-2xl bg-white border border-slate-200/50 hover:border-slate-900 hover:shadow-xs text-left transition-all group"
                        >
                          <span className="px-2 py-0.5 bg-slate-900/5 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider">
                            Pilates
                          </span>
                          <h4 className="font-bold text-slate-900 mt-2 text-sm">
                            Reformer Pilates Core
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Sarah Jenkins</p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              1 Platz
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 group-hover:underline">
                              €22,00
                            </span>
                          </div>
                        </button>

                        {/* Course C */}
                        <button
                          onClick={() => {
                            setSimulatedCourse({
                              name: "HIIT Strength Builder",
                              price: 18,
                              trainer: "Felix Kowalski",
                            });
                            setBookingStep(2);
                          }}
                          className="p-4 rounded-2xl bg-white border border-slate-200/50 hover:border-slate-900 hover:shadow-xs text-left transition-all group"
                        >
                          <span className="px-2 py-0.5 bg-slate-900/5 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider">
                            Crossfit
                          </span>
                          <h4 className="font-bold text-slate-900 mt-2 text-sm">
                            HIIT Strength Builder
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Felix Kowalski</p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              8 Plätze
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 group-hover:underline">
                              €18,00
                            </span>
                          </div>
                        </button>

                        {/* Course D */}
                        <div className="p-4 rounded-2xl bg-white/20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                            Dein Kursplan
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: STRIPE SIMULATED CHECKOUT */}
                  {bookingStep === 2 && simulatedCourse && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                      {/* Payment Form */}
                      <form className="md:col-span-7 space-y-4">
                        <div className="border-b border-slate-200 pb-2">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Sichere Zahlung
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {simulatedCourse.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Gesamtsumme: €{simulatedCourse.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Karteninhaber
                          </label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 font-medium"
                            placeholder="Max Mustermann"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            Kartennummer
                          </label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 font-medium"
                            placeholder="4242 •••• •••• ••••"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              Gültig bis
                            </label>
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 font-medium"
                              placeholder="MM / YY"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              CVC
                            </label>
                            <input
                              type="text"
                              required
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 font-medium"
                              placeholder="123"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={triggerPaymentWithExplosion}
                          disabled={isPaying}
                          className="w-full py-3 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          {isPaying ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Bezahlen (€{simulatedCourse.price.toFixed(2)})
                            </>
                          )}
                        </button>
                      </form>

                      {/* Credit Card Mockup */}
                      <div className="md:col-span-5 flex flex-col justify-center">
                        <div className="aspect-[1.586] w-full rounded-2xl bg-slate-900 p-4 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />

                          <div className="flex justify-between items-start">
                            <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">
                              Pay
                            </span>
                            <span className="w-7 h-5 rounded bg-white/10 flex items-center justify-center font-bold text-[9px] italic text-slate-300">
                              VISA
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-mono tracking-widest leading-none">
                              {cardNumber || "•••• •••• •••• ••••"}
                            </p>
                            <div className="flex justify-between items-end mt-4">
                              <div className="max-w-[70%]">
                                <p className="text-[6px] text-slate-400 uppercase leading-none">
                                  Inhaber
                                </p>
                                <p className="text-[10px] font-bold tracking-wide mt-0.5 truncate">
                                  {cardHolder || "MAX MUSTERMANN"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[6px] text-slate-400 uppercase leading-none">
                                  Gültig
                                </p>
                                <p className="text-[10px] font-mono font-bold mt-0.5">
                                  {cardExpiry || "MM/YY"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SUCCESS & TICKET PRESENTATION */}
                  {bookingStep === 3 && simulatedCourse && (
                    <div className="flex flex-col items-center justify-center text-center space-y-5 py-4 animate-fade-in">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                          Buchung Erfolgreich!
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Das Ticket wurde per E-Mail versendet.
                        </p>
                      </div>

                      {/* Virtual Ticket */}
                      <div className="w-full max-w-[280px] bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden relative">
                        <div className="absolute top-[48%] left-[-8px] w-4.5 h-4.5 rounded-full bg-[#FAF9F6] border-r border-slate-200/50" />
                        <div className="absolute top-[48%] right-[-8px] w-4.5 h-4.5 rounded-full bg-[#FAF9F6] border-l border-slate-200/50" />

                        {/* Ticket top */}
                        <div className="p-4 border-b border-dashed border-slate-200/60 text-left">
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-bold rounded uppercase tracking-wider">
                            Ticket
                          </span>
                          <h5 className="font-bold text-slate-900 mt-2.5 text-xs">
                            {simulatedCourse.name}
                          </h5>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            Trainer: {simulatedCourse.trainer}
                          </p>
                        </div>

                        {/* Ticket bottom */}
                        <div className="p-4 bg-slate-50/50 flex justify-between items-center">
                          <div className="text-left">
                            <p className="text-[7px] text-slate-400 uppercase leading-none">
                              Teilnehmer
                            </p>
                            <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                              {cardHolder || "Max Mustermann"}
                            </p>

                            <p className="text-[7px] text-slate-400 uppercase leading-none mt-3">
                              Termin
                            </p>
                            <p className="text-[9px] font-bold text-slate-800 mt-0.5">
                              Sa. 18:00 Uhr
                            </p>
                          </div>

                          {/* Fake QR code */}
                          <div className="w-12 h-12 bg-white border border-slate-200/40 rounded p-1 flex items-center justify-center">
                            <div className="grid grid-cols-5 gap-[2px] w-full h-full opacity-60">
                              {[...Array(25)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`rounded-[1px] ${
                                    (i % 2 === 0 && i % 3 !== 0) ||
                                    i === 0 ||
                                    i === 4 ||
                                    i === 20 ||
                                    i === 24
                                      ? "bg-slate-950"
                                      : "bg-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setBookingStep(1);
                          setSimulatedCourse(null);
                          setCardHolder("");
                          setCardNumber("");
                          setCardExpiry("");
                          setCardCvc("");
                        }}
                        className="px-5 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-all"
                      >
                        Anderen Kurs buchen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* PRICING SECTION (TARIFE) */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50/60 backdrop-blur-xl border border-amber-200/50 px-4 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              Kostenkontrolle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 uppercase">
              Passend für jede Studio-Größe
            </h2>
            <p className="text-slate-500 text-sm">
              Starte unverbindlich und skaliere den Plan, wenn dein Studio wächst.
            </p>

            {/* Pricing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-6">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${!isAnnual ? "text-slate-950" : "text-slate-400"}`}
              >
                Monatlich
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-11 h-5.5 rounded-full bg-slate-900/10 p-0.5 flex items-center transition-all duration-300 relative"
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-slate-900 shadow-sm transition-all transform ${isAnnual ? "translate-x-5" : ""}`}
                />
              </button>
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isAnnual ? "text-slate-950" : "text-slate-400"}`}
              >
                Jährlich
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                  20% sparen
                </span>
              </span>
            </div>
          </div>
        </Reveal>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Starter */}
          <div className="h-full">
            <Reveal delay={100} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] flex flex-col justify-between transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_180px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Starter
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                    Für einzelne Kursleiter
                  </p>

                  <div className="mt-8">
                    <span className="text-3xl font-black text-slate-950">
                      €{isAnnual ? "23" : "29"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      / Monat
                    </span>
                  </div>

                  <ul className="mt-8 space-y-4 text-xs text-slate-500 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>1 Studio-Standort</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Bis zu 3 Trainer-Accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>50 Buchungen pro Monat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Automatische E-Mail-Bestätigungen</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register/admin"
                  className="w-full text-center py-3.5 rounded-full bg-white/50 hover:bg-white border border-slate-200 text-slate-800 font-bold text-[10px] uppercase tracking-widest transition-all mt-8 shadow-xs"
                >
                  Auswählen
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Plan 2: Growth (Highlighted Conversion Card) */}
          <div className="h-full">
            <Reveal delay={200} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border-2 border-yellow/40 backdrop-blur-2xl backdrop-saturate-150 bg-white/55 p-8 flex flex-col justify-between transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_180px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.4),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full scale-[1.02] animate-glow-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_40px_rgba(244,192,12,0.10)]"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-yellow text-[9px] font-bold text-slate-900 uppercase rounded-full tracking-widest shadow-lg shadow-amber-400/30">
                  Beliebt
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Growth
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                    Für Studios & Yoga Lofts
                  </p>

                  <div className="mt-8">
                    <span className="text-3xl font-black text-slate-950">
                      €{isAnnual ? "63" : "79"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      / Monat
                    </span>
                  </div>

                  <ul className="mt-8 space-y-4 text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span className="font-bold text-slate-900">Unbegrenzte Trainer-Accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Bis zu 3 separate Räume</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>500 Buchungen pro Monat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span className="font-bold text-slate-900">Stripe Connect Zahlungen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Trainer-Rechteverwaltung</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Kundenkartei & Gesundheitsprofile</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register/admin"
                  className="w-full text-center py-3.5 rounded-full bg-yellow hover:bg-amber-400 text-slate-900 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-amber-400/25 mt-8 block transition-colors"
                >
                  Jetzt Starten
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Plan 3: Pro */}
          <div className="h-full">
            <Reveal delay={300} className="h-full">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="rounded-4xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_24px_rgba(15,23,42,0.05)] flex flex-col justify-between transition-all duration-300 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_180px_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.3),transparent_80%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none relative overflow-hidden h-full"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pro</h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                    Für Franchise- & Kettenstudios
                  </p>

                  <div className="mt-8">
                    <span className="text-3xl font-black text-slate-950">
                      €{isAnnual ? "119" : "149"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      / Monat
                    </span>
                  </div>

                  <ul className="mt-8 space-y-4 text-xs text-slate-500 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Unbegrenzte Räume & Buchungen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Mehrere Studio-Standorte</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>API & Webhook-Zugriff</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>Eigene Domain-Aufschaltung</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>24/7 Priorisierter Support</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register/admin"
                  className="w-full text-center py-3.5 rounded-full bg-white/50 hover:bg-white border border-slate-200 text-slate-800 font-bold text-[10px] uppercase tracking-widest transition-all mt-8 shadow-xs"
                >
                  Kontaktieren
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <Reveal>
          <div className="text-center space-y-4 mb-16">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50/60 backdrop-blur-xl border border-amber-200/50 px-4 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              Antworten
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 uppercase">
              Häufig gestellte Fragen
            </h2>
            <p className="text-slate-500 text-sm">Alles, was du über Kumasy wissen musst</p>
          </div>
        </Reveal>

        {/* Accordions */}
        <div className="space-y-4">
          {[
            {
              q: "Wie funktioniert die Stripe-Integration?",
              a: "Über Stripe Connect verbindest du dein Bankkonto im Dashboard mit wenigen Klicks. Sobald Kunden einen Kurs buchen, zieht Stripe die Gebühr ein, behält unsere Service-Fee von 1.5% ein und überweist den verbleibenden Betrag automatisch auf dein Bankkonto.",
            },
            {
              q: "Kann ich bestehende Kundendaten importieren?",
              a: "Ja. Unser Support-Team hilft dir gerne dabei, deine bestehende Kundenliste (z.B. aus Excel oder einer alten Studio-Software) kostenfrei einzulesen, damit du nahtlos starten kannst.",
            },
            {
              q: "Wie werden Trainer benachrichtigt, wenn sie Kurse übernehmen?",
              a: "Sobald du einen Trainer für einen Kurs einteilst, erhält er eine E-Mail-Benachrichtigung mit allen Details. Über ihren persönlichen Login können Trainer jederzeit ihren persönlichen Kursplan und die Teilnehmerlisten einsehen.",
            },
            {
              q: "Gibt es Verträge mit Mindestlaufzeit?",
              a: "Nein. Du kannst dein Abonnement zeitlich ungebunden monatlich kündigen. Wenn du dich für das Jahresabo entscheidest, sparst du 20% auf die Grundgebühr.",
            },
            {
              q: "Ist Kumasy DSGVO-konform?",
              a: "Ja, zu 100%. Die Daten werden in sicheren Rechenzentren in der EU gehostet. Insbesondere medizinische Kommentare (complaints) der Kunden sind streng geschützt und nur für autorisierte Trainer sichtbar.",
            },
          ].map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/60 backdrop-blur-2xl backdrop-saturate-150 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 transition-all"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    openFaq === index ? "rotate-180 text-slate-900" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFaq === index ? "max-h-[200px] border-t border-white/30" : "max-h-0"
                }`}
              >
                <div className="p-5 text-xs text-slate-500 leading-relaxed bg-white/5">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative">
        <Reveal>
          <div className="bg-slate-950 rounded-[40px] p-8 md:p-20 text-center space-y-8 relative overflow-hidden">
            {/* Radial glow top */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(99,102,241,0.18),transparent_65%)] pointer-events-none" />
            {/* Radial glow bottom-right */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_100%,rgba(139,92,246,0.12),transparent_65%)] pointer-events-none" />
            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.035] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="max-w-3xl mx-auto space-y-5 relative z-10">
              <span className="inline-block text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-400/10 border border-amber-400/25 px-4 py-1.5 rounded-full">
                Starte heute
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white uppercase leading-[0.95]">
                Bringe Fluss
                <br />
                in dein Studio
              </h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                Registriere dein Studio in unter 15 Minuten und biete deinen Kunden ein
                herausragendes Buchungserlebnis.
              </p>
            </div>

            <div className="max-w-md mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                />
                <Link
                  href="/register/admin"
                  className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-slate-900 bg-yellow hover:bg-amber-400 transition-colors shadow-lg shadow-amber-400/25 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  Starten
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-[10px] text-slate-600 mt-3">
                14 Tage kostenlos testen. Keine Kreditkarte erforderlich.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkle className="w-3 h-3 text-white" />
              </div>
              <span className="font-extrabold text-white tracking-tight">Kumasy.</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Die minimalistische Studio-Management Software für Yoga, Pilates, Wellness und
              Sportkurse.
            </p>
            <p className="text-[10px] text-slate-600 font-medium">
              © {new Date().getFullYear()} Since-3.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">
              Produkt
            </h5>
            <ul className="space-y-2 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-white transition-colors">
                  Live Demo
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Preise
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">
              Rechtliches
            </h5>
            <ul className="space-y-2 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">Impressum</span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Datenschutz
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">AGB</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">
              Kontakt
            </h5>
            <ul className="space-y-2 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">Support</span>
              </li>
              <li>info@since3.de</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* RENDER DYNAMIC CONFETTI PARTICLES EXPLOSION */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            style={
              {
                "--dx": p.dx,
                "--dy": p.dy,
                "--dr": p.dr,
                position: "absolute",
                left: `${p.left}px`,
                top: `${p.top}px`,
                width: "10.5px",
                height: "10.5px",
                borderRadius: p.borderRadius,
                backgroundColor: p.color,
                animation: `particle-burst 1.4s cubic-bezier(0.12, 0.89, 0.32, 0.98) ${p.delay}s forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* LIVE INTERACTIVE NOTIFICATION POPUPS */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {notification && (
          <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 pointer-events-auto animate-slide-in-right border border-slate-800/80 shadow-slate-950/60">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold leading-relaxed text-slate-200">
                {notification.text}
              </p>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">
                {notification.time}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STICKY MOBILE CTA — only visible on small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/40 backdrop-blur-2xl backdrop-saturate-150 bg-white/80 px-4 pt-3 pb-7 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]">
        <Link
          href="/register/admin"
          className="w-full py-4 rounded-full bg-yellow text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-transform"
        >
          Studio registrieren
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[9px] text-slate-400 mt-2 font-semibold tracking-wider">
          Keine Kreditkarte · 14 Tage kostenlos
        </p>
      </div>
    </div>
  );
}
