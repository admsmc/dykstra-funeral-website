import { Effect } from 'effect';
import type { CalendarSyncServicePort, AvailabilitySlot } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';

/**
 * Google Calendar Adapter (STUB IMPLEMENTATION)
 * 
 * This is a stub implementation that returns mock data. To activate production mode:
 * 1. Install SDK: npm install googleapis
 * 2. Create GCP project and enable Google Calendar API
 * 3. Set environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 * 4. Uncomment production code blocks below
 * 5. Remove stub implementations
 */

/* PRODUCTION DEPENDENCIES (uncomment when ready)
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
*/

/**
 * Lazy-load Google Calendar SDK
 * Returns null if SDK not installed (graceful degradation)
 */
async function loadGoogleCalendar() {
  try {
    // const { google } = await import('googleapis');
    // return google;
    return null; // Stub mode
  } catch {
    return null;
  }
}

/**
 * Initialize Google Calendar client for a user
 */
// @ts-expect-error - Function reserved for production use
async function _getCalendarClient(_userId: string) {
  const google = await loadGoogleCalendar();
  if (!google) {
    throw new Error('Google Calendar SDK not installed');
  }

  /* PRODUCTION CODE (uncomment when ready)
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // TODO: Fetch access token from OAuthToken table by userId
  // const token = await fetchUserToken(userId, 'google');
  // oauth2Client.setCredentials({
  //   access_token: token.accessToken,
  //   refresh_token: token.refreshToken,
  // });

  return google.calendar({ version: 'v3', auth: oauth2Client });
  */

  return null; // Stub mode
}

/**
 * Google Calendar Adapter (Stub)
 */
export const GoogleCalendarAdapter: CalendarSyncServicePort = {
  createEvent: (params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        const event: calendar_v3.Schema$Event = {
          summary: params.eventData.title,
          description: params.eventData.description || undefined,
          start: {
            dateTime: params.eventData.startTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: params.eventData.endTime.toISOString(),
            timeZone: 'UTC',
          },
          location: params.eventData.location || undefined,
          attendees: params.eventData.attendees?.map(a => ({
            email: a.email,
            displayName: a.name,
          })) || [],
          reminders: {
            useDefault: false,
            overrides: params.eventData.reminders?.map(r => ({
              method: r.method === 'email' ? 'email' : 'popup',
              minutes: r.minutesBefore,
            })) || [],
          },
        };

        const result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        return {
          externalId: result.data.id!,
          calendarEvent: params.eventData,
        };
        */

        // STUB: Return mock data
        return {
          externalId: `google-event-${Date.now()}`,
          calendarEvent: params.eventData,
        };
      },
      catch: (error) => new PersistenceError('Failed to create Google calendar event', error),
    }),

  updateEvent: (_params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        const updates: calendar_v3.Schema$Event = {};
        if (params.eventData.title) updates.summary = params.eventData.title;
        if (params.eventData.description) updates.description = params.eventData.description;
        if (params.eventData.startTime) {
          updates.start = {
            dateTime: params.eventData.startTime.toISOString(),
            timeZone: 'UTC',
          };
        }
        if (params.eventData.endTime) {
          updates.end = {
            dateTime: params.eventData.endTime.toISOString(),
            timeZone: 'UTC',
          };
        }
        if (params.eventData.location) updates.location = params.eventData.location;

        await calendar.events.patch({
          calendarId: 'primary',
          eventId: params.externalId,
          requestBody: updates,
        });
        */

        // STUB: No-op
        return;
      },
      catch: (error) => new PersistenceError('Failed to update Google calendar event', error),
    }),

  deleteEvent: (_params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: params.externalId,
        });
        */

        // STUB: No-op
        return;
      },
      catch: (error) => new PersistenceError('Failed to delete Google calendar event', error),
    }),

  getEvent: (_params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        const response = await calendar.events.get({
          calendarId: 'primary',
          eventId: params.externalId,
        });

        const event = response.data;

        return {
          title: event.summary || '',
          description: event.description || null,
          startTime: new Date(event.start?.dateTime || event.start?.date || ''),
          endTime: new Date(event.end?.dateTime || event.end?.date || ''),
          location: event.location || null,
          attendees: event.attendees?.map(a => ({
            email: a.email!,
            name: a.displayName,
            responseStatus: (a.responseStatus as any) || 'needsAction',
          })) || [],
          reminders: event.reminders?.overrides?.map(r => ({
            method: r.method === 'email' ? 'email' as const : 'popup' as const,
            minutesBefore: r.minutes!,
          })) || [],
          recurrenceRule: null, // TODO: Parse recurrence rule
        };
        */

        // STUB: Return null (not found)
        return null;
      },
      catch: (error) => new PersistenceError('Failed to get Google calendar event', error),
    }),

  listEvents: (_params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: params.startDate.toISOString(),
          timeMax: params.endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        return (response.data.items || []).map(event => ({
          externalId: event.id!,
          event: {
            title: event.summary || '',
            description: event.description || null,
            startTime: new Date(event.start?.dateTime || event.start?.date || ''),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            location: event.location || null,
            attendees: event.attendees?.map(a => ({
              email: a.email!,
              name: a.displayName,
              responseStatus: (a.responseStatus as any) || 'needsAction',
            })) || [],
            reminders: [],
            recurrenceRule: null,
          },
        }));
        */

        // STUB: Return empty array
        return [];
      },
      catch: (error) => new PersistenceError('Failed to list Google calendar events', error),
    }),

  getAvailability: (params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const calendar = await getCalendarClient(params.userId);
        
        const response = await calendar.freebusy.query({
          requestBody: {
            timeMin: params.startDate.toISOString(),
            timeMax: params.endDate.toISOString(),
            items: [{ id: 'primary' }],
          },
        });

        const busySlots = response.data.calendars?.['primary']?.busy || [];
        const slots: AvailabilitySlot[] = [];

        // Convert busy slots to availability slots
        let currentTime = params.startDate;
        for (const busy of busySlots) {
          const busyStart = new Date(busy.start!);
          const busyEnd = new Date(busy.end!);

          // Add free slot before busy period
          if (currentTime < busyStart) {
            slots.push({
              startTime: currentTime,
              endTime: busyStart,
              status: 'free',
            });
          }

          // Add busy slot
          slots.push({
            startTime: busyStart,
            endTime: busyEnd,
            status: 'busy',
          });

          currentTime = busyEnd;
        }

        // Add final free slot if needed
        if (currentTime < params.endDate) {
          slots.push({
            startTime: currentTime,
            endTime: params.endDate,
            status: 'free',
          });
        }

        return slots;
        */

        // STUB: Return mock free time
        const slots: AvailabilitySlot[] = [{
          startTime: params.startDate,
          endTime: params.endDate,
          status: 'free',
        }];
        return slots;
      },
      catch: (error) => new PersistenceError('Failed to get Google calendar availability', error),
    }),

  refreshToken: (_params: any) =>
    Effect.tryPromise({
      try: async () => {
        /* PRODUCTION CODE (uncomment when ready)
        const google = await loadGoogleCalendar();
        if (!google) throw new Error('Google Calendar SDK not installed');

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        // TODO: Fetch refresh token from OAuthToken table
        // const token = await fetchUserToken(params.userId, 'google');
        // oauth2Client.setCredentials({
        //   refresh_token: token.refreshToken,
        // });

        // const { credentials } = await oauth2Client.refreshAccessToken();
        
        // TODO: Save new access token to OAuthToken table
        // await saveUserToken(params.userId, 'google', {
        //   accessToken: credentials.access_token!,
        //   expiresAt: new Date(credentials.expiry_date!),
        // });
        */

        // STUB: No-op
        return;
      },
      catch: (error) => new PersistenceError('Failed to refresh Google token', error),
    }),
};
