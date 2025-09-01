-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Circle',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')) NOT NULL DEFAULT 'daily',
  target_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit completions table
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'completed')) NOT NULL DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  list_id UUID,
  estimate_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lists table
CREATE TABLE public.lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Inbox',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  work_seconds INTEGER NOT NULL DEFAULT 0,
  break_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (since no auth yet, allow all operations)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (no auth required for now)
CREATE POLICY "Allow all operations on habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on habit_completions" ON public.habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lists" ON public.lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pomodoro_sessions" ON public.pomodoro_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lists
INSERT INTO public.lists (id, name, icon, color) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Inbox', 'Inbox', '#6366f1'),
  ('00000000-0000-0000-0000-000000000002', 'Today', 'Calendar', '#10b981'),
  ('00000000-0000-0000-0000-000000000003', 'This Week', 'CalendarDays', '#f59e0b'),
  ('00000000-0000-0000-0000-000000000004', 'Completed', 'CheckCircle', '#8b5cf6');

-- Insert sample habits
INSERT INTO public.habits (name, icon, color, frequency, target_count) VALUES 
  ('Morning Exercise', 'Dumbbell', '#10b981', 'daily', 1),
  ('Read for 30min', 'BookOpen', '#3b82f6', 'daily', 1),
  ('Drink 8 glasses of water', 'Droplets', '#06b6d4', 'daily', 8),
  ('Weekly Planning', 'Calendar', '#8b5cf6', 'weekly', 1);

-- Insert sample tasks
INSERT INTO public.tasks (title, description, list_id, estimate_minutes, priority) VALUES 
  ('Review project requirements', 'Go through the latest project specifications', '00000000-0000-0000-0000-000000000001', 30, 'high'),
  ('Daily standup meeting', 'Team sync at 9:00 AM', '00000000-0000-0000-0000-000000000002', 15, 'medium'),
  ('Code review for PR #123', 'Review and approve pending pull request', '00000000-0000-0000-0000-000000000002', 45, 'medium'),
  ('Update documentation', 'Update API documentation with recent changes', '00000000-0000-0000-0000-000000000003', 60, 'low');