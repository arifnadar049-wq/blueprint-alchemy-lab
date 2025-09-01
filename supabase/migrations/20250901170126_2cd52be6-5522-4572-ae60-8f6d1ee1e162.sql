-- Add missing columns to lists table
ALTER TABLE public.lists ADD COLUMN "order" integer DEFAULT 0;

-- Add missing columns to tasks table
ALTER TABLE public.tasks ADD COLUMN notes text DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN due_time text;
ALTER TABLE public.tasks ADD COLUMN recurrence_rule text;
ALTER TABLE public.tasks ADD COLUMN parent_recurring_id uuid;
ALTER TABLE public.tasks ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN archived boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN order_index integer DEFAULT 0;

-- Change priority from text to integer
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

-- Rename description to match interface (keep both for compatibility)
UPDATE public.tasks SET notes = COALESCE(description, '') WHERE notes = '';

-- Create sessions table to match Session interface
CREATE TABLE public.sessions (
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

-- Create policy for sessions
CREATE POLICY "Allow all operations on sessions" 
ON public.sessions 
FOR ALL 
USING (true);

-- Create streaks table
CREATE TABLE public.streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  tasks_completed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on streaks table
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Create policy for streaks
CREATE POLICY "Allow all operations on streaks" 
ON public.streaks 
FOR ALL 
USING (true);

-- Add unique constraint on streaks date
ALTER TABLE public.streaks ADD CONSTRAINT streaks_date_unique UNIQUE (date);