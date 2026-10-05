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
  Camera,
  Film,
  Clapperboard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  Sparkles,
  Mail,
  MailCheck,
  Send,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  resendBookingEmailNotification,
  generateClientConfirmationEmailHtml,
  generateStudioNotificationEmailHtml,
} from '../services/emailService';

interface ShootSessionBookingWidgetProps {
  config: StudioConfig;
}

export const ShootSessionBookingWidget: React.FC<ShootSessionBookingWidgetProps> = ({
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
    d.setDate(d.getDate() + 2); // 2 days in advance for production shoots
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1); // skip weekends
    }
    return d.toISOString().slice(0, 10);
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());
  const [dayEventsCount, setDayEventsCount] = useState<number>(0);
  const [isCheckingDay, setIsCheckingDay] = useState<boolean>(false);

  // Time proposed by client (14:00 to 18:00)
  const [proposedTime, setProposedTime] = useState<string>('14:00');
  const [durationHours, setDurationHours] = useState<number>(1); // default 1 hora
  const [customTimeNotes, setCustomTimeNotes] = useState<string>('');

  // Production Shoot Form State
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [productionType, setProductionType] = useState<'photos' | 'video' | 'both'>('photos');
  const [shootGenre, setShootGenre] = useState<string>('bodas');
  const [shootLocation, setShootLocation] = useState<string>('');
  const [creativeConcept, setCreativeConcept] = useState<string>('');

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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const startingOffset = (firstDayOfWeek + 6) % 7;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate end time with durationHours
  const calculateEndTime = (startTime: string, hours: number) => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + hours * 60;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '15:00';
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const [y, m, d] = selectedDate.split('-').map(Number);
    const selDate = new Date(y, m - 1, d);
    if (selDate.getDay() === 0 || selDate.getDay() === 6) {
      setBookingError('Sábados y domingos se encuentran inhábiles. Por favor seleccione un día entre semana (lunes a viernes).');
      return;
    }

    if (!proposedTime) {
      setBookingError('Por favor seleccione la hora de inicio de su sesión.');
      return;
    }

    if (proposedTime < '14:00' || proposedTime > '18:00') {
      setBookingError('Los horarios de inicio de sesión parten de 14:00 (2 PM) a 18:00 (6 PM) entre semana.');
      return;
    }

    if (!shootLocation.trim()) {
      setBookingError('Por favor indique la locación prevista o dirección deseada para el rodaje.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    const calculatedEndTime = calculateEndTime(proposedTime, durationHours);
    const prodLabel =
      productionType === 'photos'
        ? 'Solo Fotografía'
        : productionType === 'video'
        ? 'Solo Video Cinematográfico'
        : 'Producción Integral (Fotos & Video)';

    const combinedNotes = `TIPO DE PRODUCCIÓN: ${prodLabel}\nLOCACIÓN: ${shootLocation}\nDURACIÓN ESTIMADA: ${durationHours} hora(s)\n${
      creativeConcept ? `CONCEPTO/NOTAS: ${creativeConcept}\n` : ''
    }${customTimeNotes ? `HORARIO PROPUESTO: ${proposedTime} (${customTimeNotes})` : ''}`;

    try {
      const booking = await bookDiscoverySession({
        clientName,
        clientEmail,
        clientPhone: clientPhone || undefined,
        shootType: shootGenre,
        date: selectedDate,
        startTime: proposedTime,
        endTime: calculatedEndTime,
        format: 'in_person',
        meetingType: 'shoot_production',
        productionType,
        location: shootLocation,
        notes: combinedNotes,
      });

      setConfirmedBooking(booking);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error al programar sesión:', err);
      setBookingError(err.message || 'No se pudo programar la sesión. Intente nuevamente.');
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

  const generateGoogleCalendarUrl = (booking: DiscoverySessionBooking) => {
    const startIso = `${booking.date.replace(/-/g, '')}T${booking.startTime.replace(':', '')}00`;
    const endIso = `${booking.date.replace(/-/g, '')}T${booking.endTime.replace(':', '')}00`;
    const title = encodeURIComponent(`Sesión de Fotos/Video: CADSTUDIO · ${booking.clientName}`);
    const details = encodeURIComponent(
      `Sesión oficial de rodaje y/o fotos con CADSTUDIO.\n\nFecha: ${booking.date}\nHorario: ${booking.startTime} a ${booking.endTime}\nLocación: ${booking.location || 'Por definir'}\n\nContacto de Mateo Valenzuela: ${config.email}`
    );
    const location = encodeURIComponent(booking.location || config.location);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=${STUDIO_TIMEZONE}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0E2931] border border-[#2B7574]/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#2B7574]/20 border border-[#2B7574]/40 text-[#2B7574] shrink-0">
            <Clapperboard className="w-4 h-4 text-[#E2E2E0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E2E2E0]">
                Programación de Sesión de Fotos y/o Videos
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#2B7574]/30 text-emerald-300 border border-[#2B7574]/60 font-medium">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Asignación de Día de Rodaje
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono-data">
              Aparta directamente el día y hora para realizar tu producción visual en Culiacán o locación acordada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isGoogleConnected ? (
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isAuthenticating}
              className="px-3 py-1.5 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
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
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0E2931] via-[#102930] to-[#070e11] border border-[#2B7574] shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 text-[#E2E2E0]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2B7574]/20 border border-[#2B7574] flex items-center justify-center text-[#E2E2E0] shrink-0">
              <CheckCircle2 className="w-6 h-6 text-[#2B7574]" />
            </div>
            <div>
              <span className="text-[11px] font-mono-data text-[#2B7574] uppercase tracking-wider block font-bold">
                SESIÓN DE RODAJE PROGRAMADA & RESERVADA
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E2E2E0] mt-0.5">
                ¡Día Asignado, {confirmedBooking.clientName}!
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Su sesión de fotos y/o video ha quedado agendada para el día <strong className="text-white">{formatDateDisplay(confirmedBooking.date)}</strong> iniciando a las <strong className="text-white">{confirmedBooking.startTime}</strong>. Mateo Valenzuela y el equipo técnico se prepararán con el equipamiento necesario.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0E2931]/60 border border-[#2B7574]/40 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">DÍA DE LA SESIÓN:</span>
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
              <span className="text-[#8cd2cf] font-mono-data font-bold">PRODUCCIÓN:</span>
              <span className="font-medium text-[#E2E2E0] uppercase font-mono-data">
                {confirmedBooking.productionType === 'photos'
                  ? 'Sesión de Fotografía de Autor'
                  : confirmedBooking.productionType === 'video'
                  ? 'Sesión de Video Cinematográfico'
                  : 'Producción Integral (Fotos & Video)'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#2B7574]/20 pb-2">
              <span className="text-[#8cd2cf] font-mono-data font-bold">LOCACIÓN ACORDADA:</span>
              <span className="font-medium text-[#E2E2E0] font-mono-data">
                {confirmedBooking.location || 'Por definir con el fotógrafo'}
              </span>
            </div>
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
                  Se ha despachado la confirmación con el itinerario a <strong className="text-white">{confirmedBooking.clientEmail}</strong> y el dossier oficial a la agenda de CADSTUDIO (<strong className="text-white">{config.email || 'cadcad111.3@gmail.com'}</strong>).
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
              onClick={() => setConfirmedBooking(null)}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Programar otra sesión
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
        /* Booking Flow */
        <div className="space-y-6">
          {/* STEP 1: Calendar Grid */}
          <div className="p-5 rounded-2xl bg-white border border-[#2B7574]/30 space-y-4 shadow-sm text-[#0E2931]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B7574]/20">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#2B7574]" />
                <h3 className="font-display text-sm sm:text-base font-bold text-[#0E2931] uppercase tracking-wide">
                  1. SELECCIONA EL DÍA PARA TU SESIÓN (LUNES A VIERNES)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-data text-[#0E2931] font-bold">
                  {monthNames[currentMonth]} {currentYear}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg bg-[#E2E2E0]/50 hover:bg-[#2B7574]/20 border border-[#2B7574]/30 text-[#0E2931] transition-colors"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg bg-[#E2E2E0]/50 hover:bg-[#2B7574]/20 border border-[#2B7574]/30 text-[#0E2931] transition-colors"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono-data text-[11px] text-[#0E2931] font-bold pb-1">
              {weekdayHeaders.map((w, index) => (
                <div
                  key={w}
                  className={`py-1 font-bold ${
                    index === 5 || index === 6 ? 'text-zinc-400' : 'text-[#0E2931]'
                  }`}
                >
                  {w} {index === 5 || index === 6 ? '(Inhábil)' : ''}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: startingOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded-xl bg-transparent" />
              ))}

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
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all relative border text-xs ${
                      isSelected
                        ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-md font-bold scale-[1.02]'
                        : isAvailable
                        ? 'bg-white hover:bg-[#2B7574]/15 border-[#2B7574]/40 text-[#0E2931] font-semibold'
                        : isWeekend
                        ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50'
                        : 'bg-zinc-100/50 border-zinc-200/60 text-zinc-400 cursor-not-allowed opacity-40'
                    }`}
                    title={
                      isWeekend
                        ? 'Sábado y domingo inhábiles (cerrado)'
                        : isPast
                        ? 'Fecha pasada'
                        : `Asignar ${tileDateStr}`
                    }
                  >
                    <span className="font-mono-data leading-none font-bold">{dayNum}</span>
                    <span className="text-[9px] mt-0.5 leading-none font-mono-data">
                      {isSelected
                        ? 'Elegido'
                        : isWeekend
                        ? 'Inhábil'
                        : isPast
                        ? 'Pasado'
                        : 'Abierto'}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2B7574] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#2B7574]/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[#0E2931] font-bold">DÍA DE RODAJE:</span>
                <span className="font-bold text-[#2B7574] capitalize text-sm">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              {isCheckingDay ? (
                <span className="text-[11px] font-mono-data text-zinc-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#2B7574]" />
                  <span>Comprobando agenda del equipo...</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono-data text-[#0E2931]/80 font-medium">
                  Agenda abierta de 14:00 a 18:00 para producciones
                </span>
              )}
            </div>
          </div>

          {/* STEP 2: Production Type & Shoot Configuration */}
          <form
            onSubmit={handleSubmitBooking}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-[#2B7574]/30 space-y-5 shadow-sm text-[#0E2931]"
          >
            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Production Type Selector */}
            <div className="space-y-3 pb-4 border-b border-[#2B7574]/20">
              <label className="block text-xs font-mono-data text-[#061418] uppercase tracking-wider font-black">
                2. ¿QUÉ TIPO DE SESIÓN DESEAS PROGRAMAR?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setProductionType('photos')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    productionType === 'photos'
                      ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-sm'
                      : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#0E2931]'
                  }`}
                >
                  <Camera className={`w-5 h-5 shrink-0 mt-0.5 ${productionType === 'photos' ? 'text-white' : 'text-[#2B7574]'}`} />
                  <div>
                    <span className="text-xs font-bold block">Solo Fotos</span>
                    <span className={`text-[10px] leading-tight block ${productionType === 'photos' ? 'text-white/80' : 'text-[#0E2931]/70'}`}>
                      Fotografía artística de autor
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductionType('video')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    productionType === 'video'
                      ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-sm'
                      : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#0E2931]'
                  }`}
                >
                  <Film className={`w-5 h-5 shrink-0 mt-0.5 ${productionType === 'video' ? 'text-white' : 'text-[#2B7574]'}`} />
                  <div>
                    <span className="text-xs font-bold block">Solo Video</span>
                    <span className={`text-[10px] leading-tight block ${productionType === 'video' ? 'text-white/80' : 'text-[#0E2931]/70'}`}>
                      Video cinematográfico & reels
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductionType('both')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    productionType === 'both'
                      ? 'bg-[#2B7574] border-[#0E2931] text-white shadow-sm'
                      : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#0E2931]'
                  }`}
                >
                  <Clapperboard className={`w-5 h-5 shrink-0 mt-0.5 ${productionType === 'both' ? 'text-white' : 'text-[#2B7574]'}`} />
                  <div>
                    <span className="text-xs font-bold block">Fotos & Video</span>
                    <span className={`text-[10px] leading-tight block ${productionType === 'both' ? 'text-white/80' : 'text-[#0E2931]/70'}`}>
                      Producción integral completa
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Time and Duration selection (14:00 to 18:00) */}
            <div className="space-y-3 pb-4 border-b border-[#2B7574]/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-mono-data text-[#061418] uppercase tracking-wider font-black">
                  3. HORARIO DE INICIO (14:00 A 18:00) Y DURACIÓN:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-data text-[#061418] font-bold">
                    Duración estimada:
                  </span>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="px-2 py-1 text-xs font-bold rounded-lg bg-[#E2E2E0]/50 border border-[#2B7574]/40 text-[#0E2931]"
                  >
                    <option value={1}>1 hora</option>
                    <option value={2}>2 horas</option>
                    <option value={3}>3 horas</option>
                    <option value={4}>4 horas (Media jornada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5">
                  <div className="flex items-center gap-2 bg-[#E2E2E0]/40 border-2 border-[#2B7574]/40 rounded-xl px-3.5 py-2.5 focus-within:border-[#2B7574]">
                    <Clock className="w-4 h-4 text-[#2B7574] shrink-0" />
                    <input
                      type="time"
                      required
                      min="14:00"
                      max="18:00"
                      value={proposedTime}
                      onChange={(e) => setProposedTime(e.target.value)}
                      className="bg-transparent text-[#0E2931] font-mono-data text-sm font-bold w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-7 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono-data text-[#0E2931] font-bold mr-1 hidden lg:inline">
                    Horas de inicio:
                  </span>
                  {[
                    { label: '14:00 (2 PM)', time: '14:00' },
                    { label: '15:00 (3 PM)', time: '15:00' },
                    { label: '16:00 (4 PM)', time: '16:00' },
                    { label: '17:00 (5 PM)', time: '17:00' },
                    { label: '18:00 (6 PM)', time: '18:00' },
                  ].map((chip) => (
                    <button
                      key={chip.time}
                      type="button"
                      onClick={() => setProposedTime(chip.time)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-data transition-all border ${
                        proposedTime === chip.time
                          ? 'bg-[#2B7574] text-white border-[#2B7574] font-bold shadow-xs'
                          : 'bg-white hover:bg-[#2B7574]/10 border-[#2B7574]/30 text-[#0E2931] font-semibold'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Client and Location Data with DARK, CRISP LABELS */}
            <div className="space-y-4">
              <label className="block text-xs font-mono-data text-[#061418] uppercase tracking-wider font-black">
                4. DATOS DEL CLIENTE Y LOCACIÓN DEL RODAJE:
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
                    placeholder="ej. Carlos Benítez"
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
                    placeholder="carlos@marca.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    TELÉFONO O WHATSAPP *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+52 667 987 6543"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                    GÉNERO VISUAL
                  </label>
                  <select
                    value={shootGenre}
                    onChange={(e) => setShootGenre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] shadow-2xs"
                  >
                    <option value="bodas">Bodas & Coberturas Emotivas</option>
                    <option value="gastronomia">Gastronomía de Autor & Restaurantes</option>
                    <option value="arquitectura">Arquitectura & Espacios</option>
                    <option value="retrato">Retrato de Autor & Editorial</option>
                    <option value="comercial">Comercial / Marcas de Moda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2B7574]" />
                  <span>LOCACIÓN O DIRECCIÓN PREVISTA DEL RODAJE *</span>
                </label>
                <input
                  type="text"
                  required
                  value={shootLocation}
                  onChange={(e) => setShootLocation(e.target.value)}
                  placeholder="ej. Jardín Botánico Culiacán / Restaurante en Tres Ríos / Residencia particular..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border-2 border-[#2B7574]/40 text-[#061418] text-xs font-semibold focus:outline-none focus:border-[#2B7574] placeholder:text-zinc-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-mono-data text-[#061418] text-xs mb-1.5 font-bold tracking-wide">
                  CONCEPTO CREATIVO O NOTAS DE PRODUCCIÓN (OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  value={creativeConcept}
                  onChange={(e) => setCreativeConcept(e.target.value)}
                  placeholder="Cuéntanos el estilo visual deseado, requerimientos de iluminación, cambios de vestuario..."
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
                    Al confirmar tu fecha, el sistema enviará en automático la confirmación con el itinerario a tu correo y el dossier oficial de la sesión a Mateo Valenzuela (<strong className="text-[#061418]">cadcad111.3@gmail.com</strong>).
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
                      <span>Apartando sesión de producción para el {selectedDate}...</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard className="w-4 h-4" />
                      <span>
                        Apartar y Programar Sesión: {formatDateDisplay(selectedDate)} de {proposedTime} a {calculateEndTime(proposedTime, durationHours)} ({durationHours}h)
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
