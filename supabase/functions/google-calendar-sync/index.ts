import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  action: 'sync';
  startDate: string;
  endDate: string;
  accessToken?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, startDate, endDate, accessToken }: SyncRequest = await req.json()
    
    if (action !== 'sync') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get calendar events from Google Calendar API
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    calendarUrl.searchParams.set('timeMin', startDate)
    calendarUrl.searchParams.set('timeMax', endDate)
    calendarUrl.searchParams.set('singleEvents', 'true')
    calendarUrl.searchParams.set('orderBy', 'startTime')

    const eventsResponse = await fetch(calendarUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!eventsResponse.ok) {
      if (eventsResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Access token expired', needsReauth: true }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      throw new Error(`Calendar API error: ${eventsResponse.status}`)
    }

    const eventsData = await eventsResponse.json()

    // Transform events to our format
    const events = eventsData.items?.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
      htmlLink: event.htmlLink,
      status: event.status,
      created: event.created,
      updated: event.updated,
    })) || []

    return new Response(
      JSON.stringify({ 
        success: true, 
        events,
        syncedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Google Calendar Sync Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})