import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { app } from '../firebase';
import {
  CalendarTimeSlot,
  DiscoverySessionBooking,
} from '../types';
import {
  getDiscoveryBookings,
  saveDiscoveryBooking,
  addActivityLog,
} from './storageService';
import { sendAutomaticBookingEmail } from './emailService';

// Scopes required for Google Calendar
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const auth = getAuth(app);
const calendarProvider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach((scope) => calendarProvider.addScope(scope));
calendarProvider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token storage (NEVER store in localStorage or sessionStorage)
let cachedCalendarAccessToken: string | null = null;
let currentCalendarUser: User | null = null;
let isSigningInCalendar = false;

// Standard studio discovery session slots (Culiacán, Mexico time: UTC-7)
// Hours run from 14:00 (2 PM) to 18:00 (6 PM) with 1 hour duration
export const DEFAULT_DISCOVERY_SLOTS: { time: string; endTime: string }[] = [
  { time: '14:00', endTime: '15:00' },
  { time: '15:00', endTime: '16:00' },
  { time: '16:00', endTime: '17:00' },
  { time: '17:00', endTime: '18:00' },
];

export const STUDIO_TIMEZONE = 'America/Mazatlan';

/**
 * Initialize Google Calendar Auth Listener
 */
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentCalendarUser = user;
      if (cachedCalendarAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedCalendarAccessToken);
      } else if (!isSigningInCalendar) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      currentCalendarUser = null;
      cachedCalendarAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in to Google to grant Calendar access
 */
export const signInWithGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningInCalendar = true;
    const result = await signInWithPopup(auth, calendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }

    cachedCalendarAccessToken = credential.accessToken;
    currentCalendarUser = result.user;

    addActivityLog({
      type: 'admin',
      title: 'Google Calendar Conectado',
      description: `Agenda del estudio conectada con ${result.user.email}. Disponibilidad en tiempo real activada.`,
    });

    return { user: result.user, accessToken: cachedCalendarAccessToken };
  } catch (error: any) {
    console.error('Error al conectar Google Calendar:', error);
    throw error;
  } finally {
    isSigningInCalendar = false;
  }
};

/**
 * Disconnect Google Calendar
 */
export const signOutCalendar = async (): Promise<void> => {
  await auth.signOut();
  cachedCalendarAccessToken = null;
  currentCalendarUser = null;
  addActivityLog({
    type: 'admin',
    title: 'Google Calendar Desconectado',
    description: 'La sesión de Google Calendar ha sido cerrada.',
  });
};

export const getCalendarAccessToken = (): string | null => {
  return cachedCalendarAccessToken;
};

export const isCalendarConnected = (): boolean => {
  return !!cachedCalendarAccessToken && !!currentCalendarUser;
};

export const getCalendarCurrentUser = (): User | null => {
  return currentCalendarUser;
};

export interface CalendarEventSummary {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
  transparency?: string;
}

/**
 * Fetch calendar events for a specific day from Google Calendar API
 */
export const fetchGoogleCalendarEventsForDay = async (
  dateStr: string
): Promise<CalendarEventSummary[]> => {
  const token = getCalendarAccessToken();
  if (!token) return [];

  try {
    // Construct local day boundaries
    const timeMin = new Date(`${dateStr}T00:00:00`).toISOString();
    const timeMax = new Date(`${dateStr}T23:59:59`).toISOString();

    const url = new URL(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    );
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn(`Google Calendar events fetch status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.files || data.items || []) as CalendarEventSummary[];
  } catch (err) {
    console.warn('Could not fetch events from Google Calendar:', err);
    return [];
  }
};

/**
 * Compute real-time slot availability for a given day (YYYY-MM-DD),
 * validating against both Google Calendar API (if authenticated) and local studio bookings.
 */
export const getDayAvailability = async (
  dateStr: string
): Promise<{
  date: string;
  isPast: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  slots: CalendarTimeSlot[];
  isGoogleSynced: boolean;
}> => {
  const selectedDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = selectedDate.getTime() < today.getTime();
  const dayOfWeek = selectedDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  // 1. Fetch Google Calendar events if token is present
  const isGoogleSynced = isCalendarConnected();
  const googleEvents: CalendarEventSummary[] = isGoogleSynced
    ? await fetchGoogleCalendarEventsForDay(dateStr)
    : [];

  // 2. Fetch existing local studio discovery bookings
  const localBookings = getDiscoveryBookings().filter(
    (b) => b.date === dateStr && b.status !== 'cancelled'
  );

  // 3. Evaluate each studio slot
  const slots: CalendarTimeSlot[] = DEFAULT_DISCOVERY_SLOTS.map((slot) => {
    if (isPast) {
      return {
        ...slot,
        available: false,
        reason: 'Fecha pasada',
      };
    }

    if (isWeekend) {
      return {
        ...slot,
        available: false,
        reason: 'Inhábil (sábado y domingo cerrado)',
      };
    }

    // Check conflict with local bookings
    const localConflict = localBookings.find((b) => b.startTime === slot.time);
    if (localConflict) {
      return {
        ...slot,
        available: false,
        reason: 'Horario reservado por otro cliente',
      };
    }

    // Check conflict with Google Calendar events
    if (isGoogleSynced && googleEvents.length > 0) {
      const slotStart = new Date(`${dateStr}T${slot.time}:00`);
      const slotEnd = new Date(`${dateStr}T${slot.endTime}:00`);

      const hasConflict = googleEvents.some((event) => {
        if (event.status === 'cancelled' || event.transparency === 'transparent') {
          return false;
        }

        const evStartStr = event.start.dateTime || `${event.start.date}T00:00:00`;
        const evEndStr = event.end.dateTime || `${event.end.date}T23:59:59`;

        const evStart = new Date(evStartStr);
        const evEnd = new Date(evEndStr);

        // Overlap test: slotStart < evEnd && slotEnd > evStart
        return slotStart < evEnd && slotEnd > evStart;
      });

      if (hasConflict) {
        return {
          ...slot,
          available: false,
          reason: 'Compromiso agendado en Google Calendar',
        };
      }
    }

    return {
      ...slot,
      available: true,
    };
  });

  return {
    date: dateStr,
    isPast,
    isWeekend,
    isSunday,
    slots,
    isGoogleSynced,
  };
};

export interface CreateBookingParams {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  shootType: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  format: 'google_meet' | 'in_person' | 'phone';
  meetingType?: 'discovery' | 'shoot_production';
  productionType?: 'photos' | 'video' | 'both';
  location?: string;
  notes?: string;
}

/**
 * Book a discovery session:
 * 1. Synchronizes directly with Google Calendar API if authenticated
 * 2. Generates Google Meet link if format is google_meet
 * 3. Persists booking to storage and Firestore
 * 4. Dispatches activity log and user confirmation
 */
export const bookDiscoverySession = async (
  params: CreateBookingParams
): Promise<DiscoverySessionBooking> => {
  const token = getCalendarAccessToken();
  let googleEventId: string | undefined;
  let meetLink: string | undefined;
  let htmlLink: string | undefined;

  const startDateTime = `${params.date}T${params.startTime}:00`;
  const endDateTime = `${params.date}T${params.endTime}:00`;

  const formatLabels: Record<string, string> = {
    google_meet: 'Videollamada en Google Meet (Enlace automático)',
    in_person: 'Presencial en CADSTUDIO (Culiacán, Sinaloa)',
    phone: 'Llamada telefónica directa',
  };

  // 1. If Google Calendar token is active, create real Google Calendar Event
  if (token) {
    try {
      const description = `SESIÓN DE DESCUBRIMIENTO & ASESORÍA TÉCNICA — CADSTUDIO\n
Cliente: ${params.clientName}
Email: ${params.clientEmail}
Teléfono: ${params.clientPhone || 'No especificado'}
Tipo de Proyecto: ${params.shootType}
Modalidad: ${formatLabels[params.format] || params.format}
Notas del cliente: ${params.notes || 'Ninguna'}

Organizado automáticamente desde cadstudio.mx`;

      const eventPayload: any = {
        summary: `Sesión de Descubrimiento: ${params.clientName} · ${params.shootType}`,
        description,
        start: {
          dateTime: new Date(startDateTime).toISOString(),
          timeZone: STUDIO_TIMEZONE,
        },
        end: {
          dateTime: new Date(endDateTime).toISOString(),
          timeZone: STUDIO_TIMEZONE,
        },
        attendees: [
          { email: params.clientEmail, displayName: params.clientName },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours prior
            { method: 'popup', minutes: 30 }, // 30 minutes prior
          ],
        },
      };

      // Request Google Meet conference if requested
      if (params.format === 'google_meet') {
        eventPayload.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      );

      if (res.ok) {
        const createdEvent = await res.json();
        googleEventId = createdEvent.id;
        htmlLink = createdEvent.htmlLink;
        meetLink =
          createdEvent.hangoutLink ||
          createdEvent.conferenceData?.entryPoints?.find(
            (ep: any) => ep.entryPointType === 'video'
          )?.uri;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Google Calendar Event API response non-ok:', errData);
      }
    } catch (err) {
      console.error('Error creating Google Calendar event:', err);
    }
  }

  // Fallback Google Meet link if needed
  if (params.format === 'google_meet' && !meetLink) {
    meetLink = 'https://meet.google.com/new';
  }

  const booking: DiscoverySessionBooking = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    clientPhone: params.clientPhone,
    shootType: params.shootType,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    timeZone: STUDIO_TIMEZONE,
    format: params.format,
    meetingType: params.meetingType || 'discovery',
    productionType: params.productionType,
    location: params.location,
    notes: params.notes,
    googleEventId,
    meetLink,
    htmlLink,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  // 4. Trigger automated email notifications to client and studio
  try {
    const emailResult = await sendAutomaticBookingEmail(booking);
    if (emailResult.success) {
      booking.emailNotificationStatus = {
        sent: true,
        clientDelivered: true,
        studioDelivered: true,
        sentAt: emailResult.log.sentAt,
        recipientClient: booking.clientEmail,
        recipientStudio: emailResult.log.recipientStudio || 'cadcad111.3@gmail.com',
      };
    }
  } catch (mailErr) {
    console.warn('[Email] Automatic notification dispatch notice:', mailErr);
  }

  await saveDiscoveryBooking(booking);
  return booking;
};
