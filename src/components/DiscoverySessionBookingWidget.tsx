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
  isTuesdayDate,
  isNextHourAfterDiscovery,
} from '../services/googleCalendarService';
import { getDiscoveryBookings } from '../services/storageService';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  Mail,
  MailCheck,
  Send,
  Eye,
  X,
} from 'lucide-react';
import {
  resendBookingEmailNotification,
  generateClientConfirmationEmailHtml,
  generateStudioNotificationEmailHtml,
} from '../services/emailService';

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

  // Selected date (defaults to next available weekday)
  const getInitialDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1); // skip Saturday and Sunday
    }
    return d.toISOString().slice(0, 10);
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());
  const [dayEventsCount, setDayEventsCount] = useState<number>(0);
  const [isCheckingDay, setIsCheckingDay] = useState<boolean>(false);

  // Tuesday rule & local bookings state
  const isTuesday = isTuesdayDate(selectedDate);
  const [dayBookings, setDayBookings] = useState<DiscoverySessionBooking[]>(() => {
    try {
      return getDiscoveryBookings().filter((b) => b.status !== 'cancelled');
    } catch {
      return [];
    }
  });

  // Time proposed by the client: 14:00 to 18:00 (on Tuesdays starts from 16:00 / 4:00 PM)
  const [proposedTime, setProposedTime] = useState<string>(() => {
    return isTuesdayDate(getInitialDate()) ? '16:00' : '14:00';
  });
  const [customTimeNotes, setCustomTimeNotes] = useState<string>('');

  const refreshDayBookings = (dateStr: string) => {
    try {
      const all = getDiscoveryBookings();
      setDayBookings(all.filter((b) => b.date === dateStr && b.status !== 'cancelled'));
    } catch {
      setDayBookings([]);
    }
  };

  useEffect(() => {
    refreshDayBookings(selectedDate);
    // Regla de los martes: las sesiones empiezan desde las 4 de la tarde (16:00)
    if (isTuesdayDate(selectedDate) && proposedTime < '16:00') {
      setProposedTime('16:00');
    }
  }, [selectedDate]);

  // Booking Form State
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [shootType, setShootType] = useState<string>('bodas');
  // Modalidad de reunión: Google Meet or Phone (Studio option removed per request)
  const [sessionFormat, setSessionFormat] = useState<'google_meet' | 'phone'>('google_meet');
  const [notes, setNotes] = useState<string>('');

  // Submission state
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<DiscoverySessionBooking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Automated Email Notification Preview & Resend state
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);
  const [previewEmailTab, setPreviewEmailTab] = useState<'client' | 'studio'>('client');
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);

  const handleResendNotification = async (booking: DiscoverySessionBooking) => {
    setIsResendingEmail(true);
    setResendSuccessMessage(null);
    try {
      const res = await resendBookingEmailNotification(booking);
      setResendSuccessMessage(res.message);
      setTimeout(() => setResendSuccessMessage(null), 5000);
    } catch (e: any) {
      setResendSuccessMessage('Error al reenviar. Verifique su conexión.');
    } finally {
      setIsResendingEmail(false);
    }
  };

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

  // Calculate end time: 1 hour (+60 minutes)
  const calculateEndTime = (startTime: string) => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + 60; // 1 hora
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '15:00';
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate weekend
    const [y, m, d] = selectedDate.split('-').map(Number);
    const selDate = new Date(y, m - 1, d);
    if (selDate.getDay() === 0 || selDate.getDay() === 6) {
      setBookingError('Sábados y domingos se encuentran inhábiles. Por favor seleccione un día entre semana (lunes a viernes).');
      return;
    }

    if (!proposedTime) {
      setBookingError('Por favor proponga un horario para la reunión.');
      return;
    }

    // Validate 14:00 to 18:00
    if (proposedTime < '14:00' || proposedTime > '18:00') {
      setBookingError('El horario de atención es de 14:00 (2 PM) a 18:00 (6 PM) entre semana.');
      return;
    }

    // Regla de los martes: las sesiones empiezan desde las 4 de la tarde (16:00)
    if (selDate.getDay() === 2 && proposedTime < '16:00') {
      setBookingError('Los martes las sesiones empiezan a partir de las 4:00 de la tarde (16:00 hrs). Por favor proponga un horario entre 16:00 y 18:00.');
      return;
    }

    // Comprobar conflicto directo de reservación
    const currentDayBookings = getDiscoveryBookings().filter(
      (b) => b.date === selectedDate && b.status !== 'cancelled'
    );
    if (currentDayBookings.some((b) => b.startTime === proposedTime)) {
      setBookingError('Este horario ya ha sido reservado por otro cliente. Por favor seleccione otro horario disponible.');
      return;
    }

    // Regla: si proponen una sesión de descubrimiento, la siguiente hora aparece ocupada
    const nextHourCheck = isNextHourAfterDiscovery(currentDayBookings, proposedTime);
    if (nextHourCheck.isBlocked) {
      setBookingError(
        `Este horario aparece ocupado: la siguiente hora tras una sesión de descubrimiento previa (de las ${nextHourCheck.priorTime || 'hora anterior'}) se mantiene reservada. Por favor seleccione otro horario.`
      );
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
        meetingType: 'discovery',
        notes: combinedNotes || undefined,
      });

      setConfirmedBooking(booking);
      refreshDayBookings(selectedDate);

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
      `Sesión de descubrimiento y asesoría técnica de 1 hora con CADSTUDIO.\n\nHorario acordado: ${booking.startTime} a ${booking.endTime}\nModalidad de reunión: ${
        booking.format === 'google_meet' ? 'Videollamada en Google Meet' : 'Llamada telefónica directa'
      }\n${booking.meetLink ? `Enlace de reunión: ${booking.meetLink}` : ''}\n\nContacto de Mateo Valenzuela: ${config.email}`
    );
    const location = encodeURIComponent(
      booking.format === 'google_meet'
        ? booking.meetLink || 'Google Meet'
        : config.phone
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
              <span className="font-semibold text-[#E2E2E0]">Agenda de Reuniones CADSTUDIO</span>
              {isGoogleConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#2B7574]/30 text-emerald-300 border border-[#2B7574]/60 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google Calendar Sincronizado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#070e11] text-[#E2E2E0] border border-[#2B7574]/30">
                  Lunes a Viernes · 14:00 a 18:00
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-300 font-mono-data">
              Horarios disponibles entre semana de 14:00 (2 PM) a 18:00 (6 PM). Sábados y domingos inhábiles.
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
                SESIÓN DE DESCUBRIMIENTO AGENDADA
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E2E2E0] mt-0.5">
                ¡Excelente, {confirmedBooking.clientName}!
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Su propuesta para el día <strong className="text-white">{formatDateDisplay(confirmedBooking.date)}</strong> a las <strong className="text-white">{confirmedBooking.startTime}</strong> ha sido agendada con éxito. Mateo Valenzuela y el equipo de CADSTUDIO revisarán los requerimientos para la asesoría técnica.
              </p>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="p-4 rounded-xl bg-[#0E2931]/60 border border-[#2B7574]/40 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">DÍA SELECCIONADO:</span>
              <span className="font-bold text-[#E2E2E0]">
                {formatDateDisplay(confirmedBooking.date)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">HORARIO & DURACIÓN:</span>
              <span className="font-bold text-[#2B7574] font-mono-data text-sm">
                {confirmedBooking.startTime} a {confirmedBooking.endTime} (Duración estimada: 1 hora)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">MODALIDAD DE REUNIÓN:</span>
              <span className="font-medium text-[#E2E2E0]">
                {confirmedBooking.format === 'google_meet'
                  ? 'Videollamada en Google Meet'
                  : 'Llamada telefónica directa'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">PROYECTO:</span>
              <span className="font-medium text-[#E2E2E0] uppercase font-mono-data">
                {confirmedBooking.shootType}
              </span>
            </div>

            {confirmedBooking.meetLink && confirmedBooking.format === 'google_meet' && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] font-mono-data text-zinc-300 block font-semibold">ENLACE DE GOOGLE MEET:</span>
                  <a
                    href={confirmedBooking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2B7574] hover:text-[#3b9493] underline font-mono-data truncate block font-bold"
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

          {/* Automatic Email Notification Confirmation Badge */}
          <div className="p-4 rounded-xl bg-[#2B7574]/20 border border-[#2B7574]/50 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#2B7574]/30 text-[#8cd2cf] shrink-0 mt-0.5">
                <MailCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">
                  ✓ Notificación automática enviada vía email
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-mono-data">
                  Se ha despachado un correo de confirmación a <strong className="text-white">{confirmedBooking.clientEmail}</strong> y la notificación con el dossier a la agenda de CADSTUDIO (<strong className="text-white">{config.email || 'cadcad111.3@gmail.com'}</strong>).
                </p>
              </div>
            </div>

            {resendSuccessMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in font-mono-data">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resendSuccessMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#2B7574]/20">
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#0E2931] hover:bg-[#1a4a58] text-[#7cc0be] text-xs font-semibold border border-[#2B7574]/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver vista previa del email enviado</span>
              </button>

              <button
                type="button"
                onClick={() => handleResendNotification(confirmedBooking)}
                disabled={isResendingEmail}
                className="px-3 py-1.5 rounded-lg bg-[#2B7574]/40 hover:bg-[#2B7574] text-white text-xs font-semibold border border-[#2B7574] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isResendingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isResendingEmail ? 'Reenviando...' : 'Reenviar notificación'}</span>
              </button>
            </div>
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

          {/* Modal Preview of Automated HTML Emails */}
          {showEmailPreviewModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
              <div className="bg-[#0E2931] border border-[#2B7574] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2B7574]/30 flex items-center justify-between bg-[#070e11]">
                  <div className="flex items-center gap-2">
                    <MailCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Vista Previa: Correo Electrónico Automático
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Así se visualiza el mensaje HTML generado por el sistema de notificaciones.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEmailPreviewModal(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs: Client vs Studio */}
                <div className="flex border-b border-[#2B7574]/30 bg-[#070e11]/50 px-4 pt-2 gap-2 text-xs font-mono-data">
                  <button
                    onClick={() => setPreviewEmailTab('client')}
                    className={`pb-2 px-3 border-b-2 font-bold transition-colors ${
                      previewEmailTab === 'client'
                        ? 'border-[#2B7574] text-white'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Copia para el Cliente ({confirmedBooking.clientEmail})
                  </button>
                  <button
                    onClick={() => setPreviewEmailTab('studio')}
                    className={`pb-2 px-3 border-b-2 font-bold transition-colors ${
                      previewEmailTab === 'studio'
                        ? 'border-[#2B7574] text-white'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Copia para el Estudio (cadcad111.3@gmail.com)
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#070e11]">
                  <div className="bg-black/40 rounded-xl p-3 mb-3 border border-white/10 text-xs font-mono-data text-zinc-300 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500">Destinatario: </span>
                      <strong className="text-white">
                        {previewEmailTab === 'client'
                          ? confirmedBooking.clientEmail
                          : config.email || 'cadcad111.3@gmail.com'}
                      </strong>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      Despachado en vivo
                    </span>
                  </div>

                  <iframe
                    title="Email Preview"
                    srcDoc={
                      previewEmailTab === 'client'
                        ? generateClientConfirmationEmailHtml(confirmedBooking, config)
                        : generateStudioNotificationEmailHtml(confirmedBooking, config)
                    }
                    className="w-full h-[460px] bg-white rounded-xl border border-zinc-700 shadow-inner"
                  />
                </div>

                <div className="p-3 border-t border-[#2B7574]/30 bg-[#070e11] flex items-center justify-between">
                  <span className="text-[11px] font-mono-data text-zinc-400">
                    ID de Cita: {confirmedBooking.id}
                  </span>
                  <button
                    onClick={() => setShowEmailPreviewModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-[#2B7574] hover:bg-[#38918f] text-white text-xs font-bold"
                  >
                    Cerrar Vista Previa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Discovery Booking Flow: Day-Based Calendar + Client Proposed Time */
        <div className="space-y-6">
          {/* STEP 1: Interactive Day Calendar Grid */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#2B7574]/25 space-y-5 shadow-lg text-[#0E2931] relative overflow-hidden">
            {/* Ambient luxury glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#2B7574]/5 blur-3xl" />

            {/* Calendar Month Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2B7574]/20 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#2B7574]/15 border border-[#2B7574]/30 text-[#2B7574]">
                  <CalendarIcon className="w-4 h-4 text-[#2B7574]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono-data tracking-widest text-[#2B7574] font-bold uppercase block">
                    AGENDA OFICIAL · CULIACÁN, SIN.
                  </span>
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0E2931] tracking-wide">
                    1. Selecciona el Día de tu Reunión (Lun a Vie)
                  </h3>
                </div>
              </div>

              {/* Month Selector Cluster */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-3.5 py-1.5 rounded-xl bg-[#E2E2E0]/40 border border-[#2B7574]/30 flex items-center gap-2">
                  <span className="text-xs font-mono-data text-[#0E2931] font-bold tracking-wider uppercase">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setCurrentMonth(now.getMonth());
                      setCurrentYear(now.getFullYear());
                      setSelectedDate(getInitialDate());
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#2B7574]/15 border border-[#2B7574]/30 text-[11px] font-mono-data font-bold text-[#0E2931] transition-all shadow-2xs"
                    title="Ir al mes actual"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#2B7574]/20 border border-[#2B7574]/30 text-[#0E2931] transition-all shadow-2xs cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#2B7574]/20 border border-[#2B7574]/30 text-[#0E2931] transition-all shadow-2xs cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center font-mono-data text-[11px] pb-1 border-b border-stone-100">
              {weekdayHeaders.map((w, index) => {
                const isWeekend = index === 5 || index === 6;
                return (
                  <div
                    key={w}
                    className={`py-1.5 rounded-lg font-bold tracking-wider uppercase text-center ${
                      isWeekend ? 'text-zinc-400 bg-stone-100/50' : 'text-[#0E2931] bg-stone-50'
                    }`}
                  >
                    <span>{w}</span>
                    {isWeekend && <span className="block text-[8px] text-zinc-400 font-normal">Cerrado</span>}
                  </div>
                );
              })}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 relative z-10">
              {/* Empty leading offset tiles */}
              {Array.from({ length: startingOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-2xl bg-stone-50/30 border border-transparent" />
              ))}

              {/* Month Day Tiles */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const tileDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const tileDate = new Date(`${tileDateStr}T00:00:00`);
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                const isPast = tileDate.getTime() < todayMidnight.getTime();
                const dayOfWeek = tileDate.getDay();
                // Sábado (6) y Domingo (0) inhabilitados
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected = selectedDate === tileDateStr;
                const isToday = tileDate.getTime() === todayMidnight.getTime();
                const isAvailable = !isPast && !isWeekend;

                return (
                  <button
                    key={tileDateStr}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedDate(tileDateStr)}
                    className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all relative border text-xs group cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#2B7574] to-[#1e5857] border-[#0E2931] text-white shadow-lg ring-2 ring-[#2B7574]/40 scale-[1.03] z-10'
                        : isAvailable
                        ? 'bg-white hover:bg-[#2B7574]/8 border-stone-200 hover:border-[#2B7574] text-[#0E2931] shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                        : isWeekend
                        ? 'bg-stone-100/70 border-stone-200/50 text-zinc-400 cursor-not-allowed opacity-60'
                        : 'bg-stone-100/40 border-stone-200/40 text-zinc-400 cursor-not-allowed opacity-40'
                    }`}
                    title={
                      isWeekend
                        ? 'Sábado y domingo inhábiles (cerrado)'
                        : isPast
                        ? 'Fecha pasada'
                        : `Seleccionar ${tileDateStr}`
                    }
                  >
                    <span className={`font-mono-data leading-none font-bold text-sm ${isSelected ? 'text-white' : 'text-[#0E2931]'}`}>
                      {dayNum}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] mt-1 leading-none font-mono-data uppercase tracking-tight ${
                      isSelected
                        ? 'text-emerald-200 font-bold'
                        : isWeekend
                        ? 'text-zinc-400'
                        : isPast
                        ? 'text-zinc-400'
                        : 'text-[#2B7574] font-semibold group-hover:text-[#2B7574]'
                    }`}>
                      {isSelected
                        ? 'Elegido'
                        : isWeekend
                        ? 'Inhábil'
                        : isPast
                        ? 'Pasado'
                        : 'Abierto'}
                    </span>
                    {isToday && !isSelected && (
                      <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2B7574] ring-2 ring-white" title="Hoy" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Status Summary Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-50 via-white to-stone-50 border border-[#2B7574]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2B7574] text-white flex flex-col items-center justify-center font-mono-data shrink-0 shadow-sm">
                  <span className="text-[9px] uppercase leading-none text-emerald-200">
                    DÍA
                  </span>
                  <span className="text-base font-black leading-none mt-0.5">
                    {selectedDate.split('-')[2]}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono-data text-zinc-500 uppercase font-bold tracking-wider block">
                    DÍA ASIGNADO PARA LA REUNIÓN:
                  </span>
                  <span className="font-bold text-[#0E2931] capitalize text-sm sm:text-base">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>
              </div>

              {isCheckingDay ? (
                <span className="text-[11px] font-mono-data text-zinc-500 flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2B7574]" />
                  <span>Verificando agenda en Google Calendar...</span>
                </span>
              ) : isTuesday ? (
                <span className="text-[11px] font-mono-data text-amber-900 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Martes: Sesiones inician a partir de las 16:00 hrs (4:00 PM)</span>
                </span>
              ) : isGoogleConnected ? (
                <span className="text-[11px] font-mono-data text-emerald-800 font-semibold flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {dayEventsCount > 0
                    ? `${dayEventsCount} citas agendadas · Horarios de 14:00 a 18:00 disponibles`
                    : 'Día libre y sincronizado con Google Calendar'}
                </span>
              ) : (
                <span className="text-[11px] font-mono-data text-[#0E2931] font-semibold flex items-center gap-1.5 self-start sm:self-auto bg-[#2B7574]/10 px-3 py-1.5 rounded-xl border border-[#2B7574]/20">
                  <Clock className="w-3.5 h-3.5 text-[#2B7574]" />
                  <span>Atención de 14:00 a 18:00 hrs · Elige tu horario</span>
                </span>
              )}
            </div>
          </div>

          {/* STEP 2: Client Proposes the Time & Contact Info */}
          <form
            onSubmit={handleSubmitBooking}
            className="p-6 sm:p-7 rounded-3xl bg-white border border-[#2B7574]/25 space-y-6 shadow-lg text-[#0E2931]"
          >
            {bookingError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5 font-medium shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Section A: Time Proposal */}
            <div className="space-y-4 pb-5 border-b border-[#2B7574]/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono-data tracking-widest text-[#2B7574] font-bold uppercase block">
                    HORARIO DE ATENCIÓN TÉCNICA
                  </span>
                  <label className="block text-xs font-mono-data text-[#061418] uppercase tracking-wider font-black">
                    2. PROPÓN TU HORARIO PREFERIDO {isTuesday ? '(MARTES: 16:00 A 18:00)' : '(14:00 A 18:00)'}:
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {isTuesday && (
                    <span className="text-[10px] font-mono-data text-amber-800 font-bold px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300">
                      Martes desde 16:00 hrs
                    </span>
                  )}
                  <span className="text-[11px] font-mono-data text-[#2B7574] font-bold px-2.5 py-1 rounded-xl bg-[#2B7574]/10 border border-[#2B7574]/30 shadow-2xs">
                    Duración: 1 hora
                  </span>
                </div>
              </div>

              {/* Notice banners for Tuesday and Next Hour Rule */}
              {isTuesday && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 font-mono-data shadow-2xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Horario exclusivo de Martes:</span>
                    <span className="text-amber-800 text-[11px]">
                      Los días martes las sesiones inician a partir de las 4:00 de la tarde (16:00 a 18:00 hrs). Los horarios anteriores permanecen cerrados.
                    </span>
                  </div>
                </div>
              )}

              {dayBookings.length > 0 && (
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-zinc-700 text-xs flex items-start gap-2.5 font-mono-data shadow-2xs">
                  <Clock className="w-4 h-4 text-[#2B7574] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0E2931] block">Margen técnico automático:</span>
                    <span className="text-zinc-600 text-[11px]">
                      Al proponerse una sesión de descubrimiento, la siguiente hora se marca ocupada automáticamente para garantizar atención personalizada.
                    </span>
                  </div>
                </div>
              )}

              {/* Aesthetic Interactive Time Slot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { label: '14:00 hrs', time: '14:00', desc: '2:00 PM' },
                  { label: '15:00 hrs', time: '15:00', desc: '3:00 PM' },
                  { label: '16:00 hrs', time: '16:00', desc: '4:00 PM' },
                  { label: '17:00 hrs', time: '17:00', desc: '5:00 PM' },
                  { label: '18:00 hrs', time: '18:00', desc: '6:00 PM' },
                ].map((slot) => {
                  const isSelectedSlot = proposedTime === slot.time;
                  const isTuesdayRestricted = isTuesday && slot.time < '16:00';
                  const bookedDirectly = dayBookings.find((b) => b.startTime === slot.time);
                  const nextHourCheck = isNextHourAfterDiscovery(dayBookings, slot.time);
                  const isNextHourBlocked = nextHourCheck.isBlocked;
                  const isUnavailable = isTuesdayRestricted || !!bookedDirectly || isNextHourBlocked;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => !isUnavailable && setProposedTime(slot.time)}
                      title={
                        isTuesdayRestricted
                          ? 'Los martes las sesiones inician a partir de las 4:00 PM (16:00 hrs)'
                          : bookedDirectly
                          ? 'Horario ya reservado'
                          : isNextHourBlocked
                          ? `Ocupado: siguiente hora tras sesión previa (de las ${nextHourCheck.priorTime || 'hora anterior'})`
                          : `Seleccionar ${slot.label}`
                      }
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative ${
                        isTuesdayRestricted
                          ? 'bg-stone-100/70 border-stone-200 text-zinc-400 cursor-not-allowed opacity-55'
                          : bookedDirectly
                          ? 'bg-rose-50/70 border-rose-200 text-rose-700/80 cursor-not-allowed opacity-60'
                          : isNextHourBlocked
                          ? 'bg-amber-50/70 border-amber-200 text-amber-800/90 cursor-not-allowed opacity-75'
                          : isSelectedSlot
                          ? 'bg-gradient-to-br from-[#2B7574] to-[#1e5857] border-[#0E2931] text-white shadow-md ring-2 ring-[#2B7574]/30 scale-[1.02] cursor-pointer'
                          : 'bg-stone-50 hover:bg-white border-stone-200 hover:border-[#2B7574]/60 text-[#0E2931] hover:shadow-2xs cursor-pointer'
                      }`}
                    >
                      <Clock
                        className={`w-3.5 h-3.5 mb-1 ${
                          isSelectedSlot
                            ? 'text-emerald-200'
                            : isUnavailable
                            ? 'text-zinc-400'
                            : 'text-[#2B7574]'
                        }`}
                      />
                      <span className="font-mono-data font-bold text-xs tracking-tight">
                        {slot.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono-data mt-0.5 leading-tight font-semibold ${
                          isSelectedSlot
                            ? 'text-emerald-200/90'
                            : isTuesdayRestricted
                            ? 'text-amber-700'
                            : bookedDirectly
                            ? 'text-rose-600'
                            : isNextHourBlocked
                            ? 'text-amber-800'
                            : 'text-zinc-500'
                        }`}
                      >
                        {isTuesdayRestricted
                          ? 'Martes 16:00+'
                          : bookedDirectly
                          ? 'Ocupado'
                          : isNextHourBlocked
                          ? 'Ocupado (Margen)'
                          : slot.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Precise Time and Note */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus-within:border-[#2B7574] focus-within:bg-white transition-colors">
                    <Clock className="w-3.5 h-3.5 text-[#2B7574] shrink-0" />
                    <span className="text-[11px] font-mono-data text-zinc-500">Hora exacta:</span>
                    <input
                      type="time"
                      required
                      min={isTuesday ? '16:00' : '14:00'}
                      max="18:00"
                      value={proposedTime}
                      onChange={(e) => setProposedTime(e.target.value)}
                      className="bg-transparent text-[#0E2931] font-mono-data text-xs font-bold w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-8">
                  <input
                    type="text"
                    value={customTimeNotes}
                    onChange={(e) => setCustomTimeNotes(e.target.value)}
                    placeholder="Nota de horario (ej. Disponibilidad flexible entre 16:00 y 18:00)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs text-[#0E2931] placeholder-zinc-400 focus:outline-none focus:border-[#2B7574] focus:bg-white transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Client Information with DARK, CRISP LABELS */}
            <div className="space-y-4">
              <label className="block text-xs font-mono-data text-[#061418] uppercase tracking-wider font-black">
                3. TUS DATOS DE CONTACTO:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    NOMBRE COMPLETO *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. Mariana Serna"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    CORREO ELECTRÓNICO *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="mariana@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    TELÉFONO O WHATSAPP
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+52 667 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    TIPO DE PROYECTO
                  </label>
                  <select
                    value={shootType}
                    onChange={(e) => setShootType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] shadow-2xs"
                  >
                    <option value="bodas">Bodas & Coberturas Emotivas</option>
                    <option value="gastronomia">Gastronomía de Autor & Restaurantes</option>
                    <option value="arquitectura">Arquitectura & Espacios</option>
                    <option value="retrato">Retrato de Autor & Editorial</option>
                  </select>
                </div>
              </div>

              {/* Modalidad de reunión (Studio option removed per request) */}
              <div>
                <label className="block font-mono-data text-[#061418] text-xs mb-2 font-bold tracking-wide">
                  MODALIDAD DE REUNIÓN:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionFormat('google_meet')}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 ${
                      sessionFormat === 'google_meet'
                        ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-sm'
                        : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#061418]'
                    }`}
                  >
                    <Video className={`w-4 h-4 shrink-0 mt-0.5 ${sessionFormat === 'google_meet' ? 'text-white' : 'text-[#2B7574]'}`} />
                    <div>
                      <span className="text-xs font-bold block">Google Meet</span>
                      <span className={`text-[10px] leading-tight block ${sessionFormat === 'google_meet' ? 'text-white/80' : 'text-[#061418]/80'}`}>
                        Videollamada con enlace automático
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionFormat('phone')}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 ${
                      sessionFormat === 'phone'
                        ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-sm'
                        : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#061418]'
                    }`}
                  >
                    <Phone className={`w-4 h-4 shrink-0 mt-0.5 ${sessionFormat === 'phone' ? 'text-white' : 'text-[#2B7574]'}`} />
                    <div>
                      <span className="text-xs font-bold block">Llamada Telefónica</span>
                      <span className={`text-[10px] leading-tight block ${sessionFormat === 'phone' ? 'text-white/80' : 'text-[#061418]/80'}`}>
                        Llamada directa a tu número
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                  NOTAS ADICIONALES (OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre locaciones deseadas, fecha estimada del evento..."
                  className="w-full p-3 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-medium focus:outline-none focus:border-[#2B7574] leading-relaxed placeholder:text-zinc-500 shadow-2xs"
                />
              </div>

              {/* Automatic Email Notification Notice */}
              <div className="p-3.5 rounded-xl bg-[#2B7574]/15 border border-[#2B7574]/40 flex items-start gap-2.5 text-xs text-[#061418]">
                <MailCheck className="w-4 h-4 text-[#2B7574] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#061418] block">
                    Sistema de Notificaciones Automáticas por Email:
                  </span>
                  <p className="text-[11px] text-zinc-700 leading-relaxed font-mono-data">
                    Al confirmar tu cita, el sistema enviará en automático la confirmación con el enlace y fecha a tu correo, y notificará en tiempo real al fotógrafo Mateo Valenzuela (<strong className="text-[#061418]">cadcad111.3@gmail.com</strong>).
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBooking || !proposedTime}
                  className="w-full py-3.5 text-xs font-bold text-white bg-[#2B7574] hover:bg-[#225e5d] disabled:opacity-40 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2B7574]/30 cursor-pointer"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Agendando reunión para el {selectedDate}...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>
                        Confirmar Reunión: {formatDateDisplay(selectedDate)} de {proposedTime} a {calculateEndTime(proposedTime)} (1 hora)
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
