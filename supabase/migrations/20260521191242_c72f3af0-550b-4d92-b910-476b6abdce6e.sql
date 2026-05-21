-- Index for efficient polling of unprocessed events
CREATE INDEX IF NOT EXISTS idx_zernio_events_poll
  ON public.zernio_webhook_events (received_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_zernio_events_type_received
  ON public.zernio_webhook_events (event_type, received_at);

-- Normalized view: extracts common fields from payload JSONB so Hermes
-- does not have to guess shapes.
CREATE OR REPLACE VIEW public.zernio_webhook_events_normalized AS
SELECT
  e.id,
  e.source,
  e.event_type,
  e.external_id AS event_external_id,
  e.received_at,
  e.processed,
  e.processing_error,
  COALESCE(e.x_handle,
           e.payload #>> '{author,username}',
           e.payload #>> '{author,screen_name}',
           e.payload #>> '{author,handle}',
           e.payload #>> '{data,author,username}',
           e.payload #>> '{data,author,screen_name}',
           e.payload #>> '{user,screen_name}',
           e.payload #>> '{user,username}'
  ) AS author_handle,
  COALESCE(e.x_user_id,
           e.payload #>> '{author,id_str}',
           e.payload #>> '{author,id}',
           e.payload #>> '{data,author,id_str}',
           e.payload #>> '{data,author,id}',
           e.payload #>> '{user,id_str}',
           e.payload #>> '{user,id}'
  ) AS author_user_id,
  COALESCE(e.payload #>> '{text}',
           e.payload #>> '{body}',
           e.payload #>> '{data,text}',
           e.payload #>> '{data,body}',
           e.payload #>> '{comment,text}',
           e.payload #>> '{comment,body}'
  ) AS comment_text,
  COALESCE(e.payload #>> '{in_reply_to_status_id_str}',
           e.payload #>> '{in_reply_to_status_id}',
           e.payload #>> '{data,in_reply_to_status_id_str}',
           e.payload #>> '{data,tweet_id}',
           e.payload #>> '{data,post_id}',
           e.payload #>> '{postId}',
           e.payload #>> '{post_id}',
           e.payload #>> '{tweet_id}',
           e.payload #>> '{object_id}'
  ) AS in_reply_to_tweet_id,
  e.payload
FROM public.zernio_webhook_events e;

-- Service role reads the view; the edge function uses service role internally.
GRANT SELECT ON public.zernio_webhook_events_normalized TO service_role;