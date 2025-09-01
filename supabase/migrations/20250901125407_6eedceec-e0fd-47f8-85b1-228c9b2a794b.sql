-- Insert some sample tasks for demonstration
INSERT INTO public.tasks (list_id, title, notes, estimate_minutes, status, subtasks) 
SELECT 
  l.id,
  task_data.title,
  task_data.notes,
  task_data.estimate_minutes,
  task_data.status::task_status,
  task_data.subtasks::jsonb
FROM public.lists l
CROSS JOIN (
  VALUES 
    ('Review project requirements', 'Go through all the requirements and make sure we understand them correctly', 30, 'todo', '[{"id":"1","title":"Read requirements doc","completed":false},{"id":"2","title":"Ask clarifying questions","completed":false}]'),
    ('Set up development environment', 'Install all necessary tools and dependencies', 45, 'in_progress', '[]'),
    ('Design database schema', 'Create the initial database design', 60, 'todo', '[{"id":"1","title":"Draft entity relationship diagram","completed":true},{"id":"2","title":"Review with team","completed":false}]'),
    ('Write unit tests', 'Add comprehensive test coverage', 90, 'todo', '[]'),
    ('Deploy to staging', 'Set up staging environment and deploy', 30, 'completed', '[]')
) AS task_data(title, notes, estimate_minutes, status, subtasks)
WHERE l.name = 'Backlog'
LIMIT 1;

-- Add a few tasks to "Today" list
INSERT INTO public.tasks (list_id, title, notes, estimate_minutes, status, due_date, subtasks) 
SELECT 
  l.id,
  task_data.title,
  task_data.notes,
  task_data.estimate_minutes,
  task_data.status::task_status,
  CURRENT_DATE,
  task_data.subtasks::jsonb
FROM public.lists l
CROSS JOIN (
  VALUES 
    ('Daily standup meeting', 'Team sync at 9 AM', 15, 'completed', '[]'),
    ('Code review for feature X', 'Review pull request #123', 30, 'in_progress', '[]'),
    ('Update documentation', 'Add new API endpoints to docs', 45, 'todo', '[{"id":"1","title":"API endpoints","completed":false},{"id":"2","title":"Examples","completed":false}]')
) AS task_data(title, notes, estimate_minutes, status, subtasks)
WHERE l.name = 'Today'
LIMIT 1;