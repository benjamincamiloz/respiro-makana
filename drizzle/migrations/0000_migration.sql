CREATE TABLE public.clara_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clara_messages_device_idx ON public.clara_messages (device_id, created_at);
GRANT ALL ON public.clara_messages TO service_role;
ALTER TABLE public.clara_messages ENABLE ROW LEVEL SECURITY;