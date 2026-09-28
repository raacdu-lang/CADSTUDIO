import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  DiscoverySessionBooking,
  StudioConfig,
} from '../types';
import {
  bookDiscoverySession,
  signInWithGoogleCalendar,
  signOutCalendar,
  isCalendarConnected,
  getCalendarCurrentUser,
  initCalendarAuth,
  STUDIO_TIMEZONE,
  fetchGoogleCalendarEventsForDay,
} from '../services/googleCalendarService';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Loader2,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

interface DiscoverySessionBookingWidgetProps {
  config: StudioConfig;
}

export const DiscoverySessionBookingWidget: React.FC<DiscoverySessionBookingWidgetProps> = ({
  config,
}) => {
  // Calendar Google OAuth state
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(isCalendarConnected());
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(
    getCalendarCurrentUser()?.email || null
  );
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Month navigation state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  // Selected date (defaults to tomorrow)
  const getInitialDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1); // skip Sunday
    }
    return d.toISOString().slice(0, 10);
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());
  const [dayEventsCount, setDayEventsCount] = useState<number>(0);
  const [isCheckingDay, setIsCheckingDay] = useState<boolean>(false);

  // Time proposed by the client (as requested: "el horario que lo proponga el cliente")
  const [proposedTime, setProposedTime] = useState<string>('11:00');
  const [customTimeNotes, setCustomTimeNotes] = useState<string>('');

  // Booking Form State
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [shootType, setShootType] = useState<string>('bodas');
  const [sessionFormat, setSessionFormat] = useState<'google_meet' | 'in_person' | 'phone'>('google_meet');
  const [notes, setNotes] = useState<string>('');

  // Submission state
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<DiscoverySessionBooking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (user, _token) => {
        setIsGoogleConnected(true);
        setCurrentUserEmail(user.email);
        checkDayCalendar(selectedDate);
      },
      () => {
        setIsGoogleConnected(false);
        setCurrentUserEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When selectedDate changes, check if day has any events in Google Calendar
  useEffect(() => {
    checkDayCalendar(selectedDate);
  }, [selectedDate, isGoogleConnected]);

  const checkDayCalendar = async (dateStr: string) => {
    if (!isCalendarConnected()) {
      setDayEventsCount(0);
      return;
    }
    setIsCheckingDay(true);
    try {
      const events = await fetchGoogleCalendarEventsForDay(dateStr);
      setDayEventsCount(events.length);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsCheckingDay(false);
    }
  };

  const handleSignInGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setIsGoogleConnected(true);
        setCurrentUserEmail(res.user.email);
        checkDayCalendar(selectedDate);
      }
    } catch (err: any) {
      console.warn('Google Calendar sign-in cancelled or failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOutGoogle = async () => {
    await signOutCalendar();
    setIsGoogleConnected(false);
    setCurrentUserEmail(null);
    setDayEventsCount(0);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build calendar days grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  // Convert Sunday=0 to Monday=0 index: (firstDayOfWeek + 6) % 7
  const startingOffset = (firstDayOfWeek + 6) % 7;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate end time (+45 minutes)
  const calculateEndTime = (startTime: string) => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + 45;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '11:45';
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedTime) {
      setBookingError('Por favor proponga un horario para la sesión.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    const calculatedEndTime = calculateEndTime(proposedTime);
    const combinedNotes = customTimeNotes
      ? `${notes ? `${notes}\n\n` : ''}Horario propuesto por cliente: ${proposedTime} (${customTimeNotes})`
      : notes;

    try {
      const booking = await bookDiscoverySession({
        clientName,
        clientEmail,
        clientPhone: clientPhone || undefined,
        shootType,
        date: selectedDate,
        startTime: proposedTime,
        endTime: calculatedEndTime,
        format: sessionFormat,
        notes: combinedNotes || undefined,
      });

      setConfirmedBooking(booking);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error al agendar sesión:', err);
      setBookingError(err.message || 'No se pudo agendar la sesión. Intente nuevamente.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Google Calendar URL Generator
  const generateGoogleCalendarUrl = (booking: DiscoverySessionBooking) => {
    const startIso = `${booking.date.replace(/-/g, '')}T${booking.startTime.replace(':', '')}00`;
    const endIso = `${booking.date.replace(/-/g, '')}T${booking.endTime.replace(':', '')}00`;
    const title = encodeURIComponent(`Sesión de Descubrimiento: CADSTUDIO · ${booking.shootType}`);
    const details = encodeURIComponent(
      `Sesión de asesoría técnica y conceptual para proyecto fotográfico con CADSTUDIO.\n\nHorario propuesto por el cliente: ${booking.startTime}\nFormato: ${
        booking.format === 'google_meet' ? 'Videollamada en Google Meet' : 'Presencial en CADSTUDIO Culiacán'
      }\n${booking.meetLink ? `Enlace de reunión: ${booking.meetLink}` : ''}\n\nContacto de Mateo Valenzuela: ${config.email}`
    );
    const location = encodeURIComponent(
      booking.format === 'google_meet'
        ? booking.meetLink || 'Google Meet'
        : config.location
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=${STUDIO_TIMEZONE}`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Google Calendar Connection Bar with Brand Palette */}
      <div className="p-3.5 rounded-2xl bg-[#0E2931] border border-[#2B7574]/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#2B7574]/20 border border-[#2B7574]/40 text-[#2B7574] shrink-0">
            <CalendarIcon className="w-4 h-4 text-[#E2E2E0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E2E2E0]">Agenda por Días del Estudio</span>
              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#2B7574]/30 text-emerald-300 border border-[#2B7574]/60 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google Calendar Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#070e11] text-[#E2E2E0] border border-[#2B7574]/30">
                  Agenda CADSTUDIO Culiacán
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-300/80 font-mono-data">
              Seleccione el día y proponga libremente el horario que mejor le convenga
            </p>
          </div>
        </div>

        {/* Studio Admin Sync button if not connected */}
        <div className="flex items-center gap-2">
          {!isGoogleConnected ? (
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isAuthenticating}
              className="px-3 py-1.5 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              title="Sincronizar directamente con Google Calendar"
            >
              {isAuthenticating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <CalendarCheck className="w-3.5 h-3.5" />
              )}
              <span>Conectar Google Calendar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-data text-zinc-300 hidden sm:inline">
                {currentUserEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOutGoogle}
                className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-rose-400 bg-black/40 rounded-lg transition-colors border border-white/10"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmedBooking ? (
        /* Confirmation Card */
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0E2931] via-[#102930] to-[#070e11] border border-[#2B7574] shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2B7574]/20 border border-[#2B7574] flex items-center justify-center text-[#E2E2E0] shrink-0">
              <CheckCircle2 className="w-6 h-6 text-[#2B7574]" />
            </div>
            <div>
              <span className="text-[11px] font-mono-data text-[#2B7574] uppercase tracking-wider block font-bold">
                SESIÓN AGENDADA & REGISTRADA
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E2E2E0] mt-0.5">
                ¡Excelente, {confirmedBooking.clientName}!
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Su propuesta para el día <strong className="text-white">{formatDateDisplay(confirmedBooking.date)}</strong> a las <strong className="text-white">{confirmedBooking.startTime}</strong> ha sido agendada. Mateo Valenzuela y el equipo de CADSTUDIO revisarán los detalles para la asesoría técnica.
              </p>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="p-4 rounded-xl bg-[#0E2931]/60 border border-[#2B7574]/40 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-zinc-400 font-mono-data">DÍA SELECCIONADO:</span>
              <span className="font-bold text-[#E2E2E0]">
                {formatDateDisplay(confirmedBooking.date)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-zinc-400 font-mono-data">HORARIO PROPUESTO:</span>
              <span className="font-bold text-[#2B7574] font-mono-data text-sm">
                {confirmedBooking.startTime} (Duración estimada: 45 min)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-zinc-400 font-mono-data">MODALIDAD:</span>
              <span className="font-medium text-[#E2E2E0]">
                {confirmedBooking.format === 'google_meet'
                  ? 'Videollamada en Google Meet'
                  : confirmedBooking.format === 'in_person'
                  ? `Presencial en CADSTUDIO (${config.location})`
                  : 'Llamada telefónica directa'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-zinc-400 font-mono-data">PROYECTO:</span>
              <span className="font-medium text-[#E2E2E0] uppercase font-mono-data">
                {confirmedBooking.shootType}
              </span>
            </div>

            {confirmedBooking.meetLink && confirmedBooking.format === 'google_meet' && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] font-mono-data text-zinc-400 block">ENLACE DE GOOGLE MEET:</span>
                  <a
                    href={confirmedBooking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2B7574] hover:text-[#3b9493] underline font-mono-data truncate block"
                  >
                    {confirmedBooking.meetLink}
                  </a>
                </div>

                <a
                  href={confirmedBooking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-[#0E2931]/60"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Unirse a Google Meet</span>
                </a>
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={generateGoogleCalendarUrl(confirmedBooking)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#0E2931] hover:bg-[#133742] text-[#E2E2E0] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#2B7574]/60 shadow"
            >
              <CalendarCheck className="w-4 h-4 text-[#2B7574]" />
              <span>Añadir a mi Google Calendar</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            <button
              onClick={() => {
                setConfirmedBooking(null);
              }}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Agendar para otro día
            </button>
          </div>
        </div>
      ) : (
        /* Discovery Booking Flow: Day-Based Calendar + Client Proposed Time */
        <div className="space-y-6">
          {/* STEP 1: Interactive Day Calendar Grid */}
          <div className="p-5 rounded-2xl bg-[#0E2931]/50 border border-[#2B7574]/40 space-y-4 shadow-xl">
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2B7574]/20">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#2B7574]" />
                <h3 className="font-display text-base font-bold text-[#E2E2E0] uppercase tracking-wide">
                  1. SELECCIONA EL DÍA DE TU SESIÓN
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data text-[#E2E2E0] font-semibold">
                  {monthNames[currentMonth]} {currentYear}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574]/30 border border-[#2B7574]/40 text-[#E2E2E0] transition-colors"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574]/30 border border-[#2B7574]/40 text-[#E2E2E0] transition-colors"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono-data text-[11px] text-zinc-400 pb-1">
              {weekdayHeaders.map((w) => (
                <div key={w} className="py-1 font-semibold">
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty leading offset tiles */}
              {Array.from({ length: startingOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded-xl bg-transparent" />
              ))}

              {/* Month Day Tiles */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const tileDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const tileDate = new Date(`${tileDateStr}T00:00:00`);
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                const isPast = tileDate.getTime() < todayMidnight.getTime();
                const isSunday = tileDate.getDay() === 0;
                const isSelected = selectedDate === tileDateStr;
                const isToday = tileDate.getTime() === todayMidnight.getTime();

                const isAvailable = !isPast && !isSunday;

                return (
                  <button
                    key={tileDateStr}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedDate(tileDateStr)}
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all relative border text-xs ${
                      isSelected
                        ? 'bg-[#2B7574] border-[#E2E2E0] text-[#E2E2E0] shadow-lg shadow-[#0E2931] font-bold scale-[1.02]'
                        : isAvailable
                        ? 'bg-[#0E2931]/80 hover:bg-[#2B7574]/25 border-[#2B7574]/30 text-zinc-200'
                        : isSunday
                        ? 'bg-black/30 border-zinc-900/60 text-zinc-600 cursor-not-allowed opacity-40'
                        : 'bg-black/20 border-zinc-900/40 text-zinc-600 cursor-not-allowed opacity-30'
                    }`}
                  >
                    <span className="font-mono-data leading-none">{dayNum}</span>
                    <span className="text-[9px] mt-0.5 leading-none font-mono-data opacity-80">
                      {isSelected
                        ? 'Elegido'
                        : isSunday
                        ? 'Cerrado'
                        : isPast
                        ? 'Pasado'
                        : 'Abierto'}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#2B7574] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Status Summary */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#2B7574]/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-zinc-400">DÍA SELECCIONADO:</span>
                <span className="font-bold text-[#E2E2E0] capitalize">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              {isCheckingDay ? (
                <span className="text-[11px] font-mono-data text-zinc-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#2B7574]" />
                  <span>Verificando agenda en Google Calendar...</span>
                </span>
              ) : isGoogleConnected ? (
                <span className="text-[11px] font-mono-data text-[#2B7574] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {dayEventsCount > 0
                    ? `${dayEventsCount} compromisos en el día · Agenda abierta para tu propuesta`
                    : 'Día con amplia disponibilidad en Google Calendar'}
                </span>
              ) : (
                <span className="text-[11px] font-mono-data text-zinc-400">
                  Estudio disponible · Propón tu horario preferido
                </span>
              )}
            </div>
          </div>

          {/* STEP 2: Client Proposes the Time & Contact Info */}
          <form onSubmit={handleSubmitBooking} className="p-5 rounded-2xl bg-[#0E2931]/50 border border-[#2B7574]/40 space-y-5 shadow-xl">
            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Section A: Time Proposal (Requested by user) */}
            <div className="space-y-3 pb-4 border-b border-[#2B7574]/20">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono-data text-[#E2E2E0] uppercase tracking-wider font-semibold">
                  2. PROPÓN TU HORARIO PREFERIDO:
                </label>
                <span className="text-[11px] font-mono-data text-zinc-400">
                  (Duración estimada: 45 min)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Direct Time Input */}
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-2 bg-[#0E2931] border border-[#2B7574] rounded-xl px-3 py-2">
                    <Clock className="w-4 h-4 text-[#2B7574] shrink-0" />
                    <input
                      type="time"
                      required
                      value={proposedTime}
                      onChange={(e) => setProposedTime(e.target.value)}
                      className="bg-transparent text-[#E2E2E0] font-mono-data text-sm font-bold w-full focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="sm:col-span-8 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono-data text-zinc-400 mr-1 hidden lg:inline">
                    Sugerencias:
                  </span>
                  {[
                    { label: '10:00 AM', time: '10:00' },
                    { label: '11:30 AM', time: '11:30' },
                    { label: '16:00 (4 PM)', time: '16:00' },
                    { label: '17:30 (5:30 PM)', time: '17:30' },
                  ].map((chip) => (
                    <button
                      key={chip.time}
                      type="button"
                      onClick={() => setProposedTime(chip.time)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-data transition-all border ${
                        proposedTime === chip.time
                          ? 'bg-[#2B7574] text-[#E2E2E0] border-[#E2E2E0] font-bold'
                          : 'bg-[#0E2931] hover:bg-[#2B7574]/20 border-[#2B7574]/40 text-zinc-300'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional note about time flexibility */}
              <div>
                <input
                  type="text"
                  value={customTimeNotes}
                  onChange={(e) => setCustomTimeNotes(e.target.value)}
                  placeholder="ej. Tengo flexibilidad entre 10:00 y 13:00, o por la tarde"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E2931]/70 border border-[#2B7574]/30 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#2B7574]"
                />
              </div>
            </div>

            {/* Section B: Client Information */}
            <div className="space-y-4">
              <label className="block text-xs font-mono-data text-[#E2E2E0] uppercase tracking-wider font-semibold">
                3. TUS DATOS DE CONTACTO:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-zinc-400 text-xs mb-1">
                    NOMBRE COMPLETO *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. Mariana Serna"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-white text-xs focus:outline-none focus:border-[#2B7574]"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 text-xs mb-1">
                    CORREO ELECTRÓNICO *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="mariana@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-white text-xs focus:outline-none focus:border-[#2B7574]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-zinc-400 text-xs mb-1">
                    TELÉFONO O WHATSAPP
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+52 667 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-white text-xs focus:outline-none focus:border-[#2B7574]"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 text-xs mb-1">
                    TIPO DE PROYECTO
                  </label>
                  <select
                    value={shootType}
                    onChange={(e) => setShootType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-white text-xs focus:outline-none focus:border-[#2B7574]"
                  >
                    <option value="bodas">Bodas & Coberturas Emotivas</option>
                    <option value="gastronomia">Gastronomía de Autor & Restaurantes</option>
                    <option value="arquitectura">Arquitectura & Espacios</option>
                    <option value="retrato">Retrato de Autor & Editorial</option>
                  </select>
                </div>
              </div>

              {/* Session Format Selection */}
              <div>
                <label className="block font-mono-data text-zinc-400 text-xs mb-2">
                  MODALIDAD DE LA SESIÓN:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionFormat('google_meet')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      sessionFormat === 'google_meet'
                        ? 'bg-[#2B7574] border-[#E2E2E0] text-[#E2E2E0] shadow-md font-medium'
                        : 'bg-[#0E2931] hover:bg-[#0E2931]/80 border-[#2B7574]/40 text-zinc-400'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#E2E2E0] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-[#E2E2E0]">Google Meet</span>
                      <span className="text-[10px] text-zinc-300 leading-tight block">
                        Videollamada automática
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionFormat('in_person')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      sessionFormat === 'in_person'
                        ? 'bg-[#2B7574] border-[#E2E2E0] text-[#E2E2E0] shadow-md font-medium'
                        : 'bg-[#0E2931] hover:bg-[#0E2931]/80 border-[#2B7574]/40 text-zinc-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#E2E2E0] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-[#E2E2E0]">Presencial</span>
                      <span className="text-[10px] text-zinc-300 leading-tight block">
                        CADSTUDIO Culiacán
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionFormat('phone')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      sessionFormat === 'phone'
                        ? 'bg-[#2B7574] border-[#E2E2E0] text-[#E2E2E0] shadow-md font-medium'
                        : 'bg-[#0E2931] hover:bg-[#0E2931]/80 border-[#2B7574]/40 text-zinc-400'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-[#E2E2E0] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-[#E2E2E0]">Llamada</span>
                      <span className="text-[10px] text-zinc-300 leading-tight block">
                        Directa a tu teléfono
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 text-xs mb-1">
                  NOTAS ADICIONALES (OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre locaciones deseadas, fecha estimada del evento..."
                  className="w-full p-2.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-white text-xs focus:outline-none focus:border-[#2B7574] leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBooking || !proposedTime}
                  className="w-full py-3.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] disabled:opacity-40 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#0E2931]/60"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Agendando sesión para el {selectedDate}...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>
                        Confirmar y Agendar: {formatDateDisplay(selectedDate)} a las {proposedTime}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
