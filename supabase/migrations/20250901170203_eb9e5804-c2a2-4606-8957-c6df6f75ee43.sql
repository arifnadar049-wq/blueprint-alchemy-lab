-- Fix priority column type conversion
ALTER TABLE public.tasks ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE public.tasks ALTER COLUMN priority TYPE integer USING (
  CASE 
    WHEN priority = 'urgent' THEN 1
    WHEN priority = 'high' THEN 2
    WHEN priority = 'medium' THEN 3
    WHEN priority = 'low' THEN 4
    WHEN priority = 'lowest' THEN 5
    ELSE 3
  END
);
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 3;

-- Add missing columns to lists table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lists' AND column_name = 'order') THEN
    ALTER TABLE public.lists ADD COLUMN "order" integer DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to tasks table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'notes') THEN
    ALTER TABLE public.tasks ADD COLUMN notes text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_time') THEN
    ALTER TABLE public.tasks ADD COLUMN due_time text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'recurrence_rule') THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence_rule text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'parent_recurring_id') THEN
    ALTER TABLE public.tasks ADD COLUMN parent_recurring_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'subtasks') THEN
    ALTER TABLE public.tasks ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'archived') THEN
    ALTER TABLE public.tasks ADD COLUMN archived boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'order_index') THEN
    ALTER TABLE public.tasks ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Update notes from description if empty
UPDATE public.tasks SET notes = COALESCE(description, '') WHERE notes = '';

-- Create sessions table if not exists
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid,
  mode text NOT NULL DEFAULT 'continuous',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  work_seconds integer NOT NULL DEFAULT 0,
  break_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow all operations on sessions') THEN
    CREATE POLICY "Allow all operations on sessions" 
    ON public.sessions 
    FOR ALL 
    USING (true);
  END IF;
END $$;

-- Create streaks table if not exists
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  tasks_completed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on streaks table
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Create policy for streaks if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streaks' AND policyname = 'Allow all operations on streaks') THEN
    CREATE POLICY "Allow all operations on streaks" 
    ON public.streaks 
    FOR ALL 
    USING (true);
  END IF;
END $$;

-- Add unique constraint on streaks date if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'streaks_date_unique') THEN
    ALTER TABLE public.streaks ADD CONSTRAINT streaks_date_unique UNIQUE (date);
  END IF;
END $$;