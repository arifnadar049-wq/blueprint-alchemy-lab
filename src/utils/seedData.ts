import { List, Task, TaskStatus, TimerMode } from '@/types';
import { generateId } from './helpers';

export const createSeedData = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Default Lists
  const lists: List[] = [
    {
      id: 'backlog',
      name: 'Backlog',
      color: 'hsl(var(--list-backlog))',
      icon: 'Inbox',
      order: 0,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'today',
      name: 'Today',
      color: 'hsl(var(--list-today))',
      icon: 'Calendar',
      order: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'this-week',
      name: 'This Week',
      color: 'hsl(var(--list-week))',
      icon: 'CalendarDays',
      order: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'completed',
      name: 'Completed',
      color: 'hsl(var(--list-completed))',
      icon: 'CheckCircle',
      order: 3,
      createdAt: now,
      updatedAt: now
    }
  ];

  // Sample Tasks
  const tasks: Task[] = [
    {
      id: generateId(),
      listId: 'today',
      title: 'Review project specifications',
      notes: 'Go through the requirements document and identify key deliverables for the GRIT productivity app.',
      estimateMinutes: 45,
      dueDate: today,
      dueTime: '09:00',
      status: TaskStatus.TODO,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [
        { id: generateId(), title: 'Read requirements doc', completed: true },
        { id: generateId(), title: 'Create task breakdown', completed: false },
        { id: generateId(), title: 'Estimate timeline', completed: false }
      ],
      priority: 2,
      completedAt: null,
      archived: false,
      orderIndex: 0,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      listId: 'today', 
      title: 'Implement timer component',
      notes: 'Build the floating timer with **Pomodoro**, *continuous*, and countdown modes.\n\n**Requirements:**\n- Always on top\n- Dockable to screen edges\n- Keyboard shortcuts',
      estimateMinutes: 120,
      dueDate: today,
      dueTime: '14:00',
      status: TaskStatus.IN_PROGRESS,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [
        { id: generateId(), title: 'Create timer state management', completed: true },
        { id: generateId(), title: 'Build UI components', completed: false },
        { id: generateId(), title: 'Add keyboard shortcuts', completed: false },
        { id: generateId(), title: 'Implement notifications', completed: false }
      ],
      priority: 1,
      completedAt: null,
      archived: false,
      orderIndex: 1,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      listId: 'this-week',
      title: 'Design reports dashboard',
      notes: 'Create analytics views for productivity tracking and time analysis.',
      estimateMinutes: 90,
      dueDate: nextWeek,
      dueTime: null,
      status: TaskStatus.TODO,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [],
      priority: 3,
      completedAt: null,
      archived: false,
      orderIndex: 0,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      listId: 'backlog',
      title: 'Add keyboard shortcuts',
      notes: 'Implement global hotkeys for starting/stopping timer and quick task creation.',
      estimateMinutes: 60,
      dueDate: null,
      dueTime: null,
      status: TaskStatus.TODO,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [],
      priority: 4,
      completedAt: null,
      archived: false,
      orderIndex: 0,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      listId: 'backlog',
      title: 'Set up recurring daily standup',
      notes: 'Plan and review daily goals every morning at 9 AM.',
      estimateMinutes: 15,
      dueDate: null,
      dueTime: '09:00',
      status: TaskStatus.TODO,
      recurrenceRule: 'FREQ=DAILY;BYHOUR=9',
      parentRecurringId: null,
      subtasks: [],
      priority: 3,
      completedAt: null,
      archived: false,
      orderIndex: 1,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateId(),
      listId: 'completed',
      title: 'Setup project structure',
      notes: 'Initialize React app with TypeScript and Tailwind CSS configuration.',
      estimateMinutes: 30,
      dueDate: today,
      dueTime: null,
      status: TaskStatus.COMPLETED,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [
        { id: generateId(), title: 'Create React app', completed: true },
        { id: generateId(), title: 'Configure TypeScript', completed: true },
        { id: generateId(), title: 'Setup Tailwind', completed: true },
        { id: generateId(), title: 'Install dependencies', completed: true }
      ],
      priority: 2,
      completedAt: today,
      archived: false,
      orderIndex: 0,
      tags: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now
    }
  ];

  return { lists, tasks };
};