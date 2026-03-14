const STORAGE_KEY = 'sevenHabitsPlannerV1';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const state = loadState();

const els = {
  missionFocus: document.getElementById('missionFocus'),
  rolesFocus: document.getElementById('rolesFocus'),
  q2Focus: document.getElementById('q2Focus'),
  reflectionPrompt: document.getElementById('reflectionPrompt'),
  saveHabits: document.getElementById('saveHabits'),
  loadDemoData: document.getElementById('loadDemoData'),
  clearAllData: document.getElementById('clearAllData'),

  weeklyTaskForm: document.getElementById('weeklyTaskForm'),
  weeklyTaskTitle: document.getElementById('weeklyTaskTitle'),
  weeklyTaskDay: document.getElementById('weeklyTaskDay'),
  weeklyTaskPriority: document.getElementById('weeklyTaskPriority'),
  addUnscheduled: document.getElementById('addUnscheduled'),
  weeklyTaskList: document.getElementById('weeklyTaskList'),

  dailyDaySelect: document.getElementById('dailyDaySelect'),
  dailyTaskList: document.getElementById('dailyTaskList'),

  eventForm: document.getElementById('eventForm'),
  eventTitle: document.getElementById('eventTitle'),
  eventDay: document.getElementById('eventDay'),
  eventStart: document.getElementById('eventStart'),
  eventEnd: document.getElementById('eventEnd'),
  eventWarnings: document.getElementById('eventWarnings'),
  eventList: document.getElementById('eventList'),

  copyWeekly: document.getElementById('copyWeekly'),
  copyDaily: document.getElementById('copyDaily'),
  weeklyExport: document.getElementById('weeklyExport'),
  dailyExport: document.getElementById('dailyExport')
};

init();

function init() {
  populateTimeOptions();
  hydrateHabits();

  els.saveHabits.addEventListener('click', () => {
    state.habits = {
      missionFocus: els.missionFocus.value.trim(),
      rolesFocus: els.rolesFocus.value.trim(),
      q2Focus: els.q2Focus.value.trim(),
      reflectionPrompt: els.reflectionPrompt.value.trim()
    };
    persist();
    renderExports();
  });

  els.weeklyTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = {
      id: crypto.randomUUID(),
      title: els.weeklyTaskTitle.value.trim(),
      day: els.weeklyTaskDay.value,
      priority: els.weeklyTaskPriority.value,
      done: false,
      createdAt: new Date().toISOString()
    };

    if (!task.day) {
      alert('Please pick a day, or use the Unscheduled Big Rock button.');
      return;
    }

    state.weeklyTasks.push(task);
    els.weeklyTaskForm.reset();
    persistAndRender();
  });

  els.addUnscheduled.addEventListener('click', () => {
    const title = els.weeklyTaskTitle.value.trim();
    if (!title) {
      alert('Type a task title first to add an unscheduled Big Rock.');
      return;
    }

    state.weeklyTasks.push({
      id: crypto.randomUUID(),
      title,
      day: 'Unscheduled Big Rocks',
      priority: els.weeklyTaskPriority.value,
      done: false,
      createdAt: new Date().toISOString()
    });
    els.weeklyTaskTitle.value = '';
    persistAndRender();
  });

  els.dailyDaySelect.addEventListener('change', renderDailyTasks);

  els.eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const start = els.eventStart.value;
    const end = els.eventEnd.value;
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      alert('End time must be after start time.');
      return;
    }

    state.events.push({
      id: crypto.randomUUID(),
      title: els.eventTitle.value.trim(),
      day: els.eventDay.value,
      start,
      end
    });

    els.eventTitle.value = '';
    persistAndRender();
  });

  els.copyWeekly.addEventListener('click', () => copyText(els.weeklyExport.textContent));
  els.copyDaily.addEventListener('click', () => copyText(els.dailyExport.textContent));

  els.loadDemoData.addEventListener('click', loadDemoData);
  els.clearAllData.addEventListener('click', clearAllData);

  persistAndRender();
}

function renderWeeklyTasks() {
  const sorted = [...state.weeklyTasks].sort((a, b) => dayOrder(a.day) - dayOrder(b.day));
  els.weeklyTaskList.innerHTML = '';

  sorted.forEach((task) => {
    const row = document.createElement('article');
    row.className = 'item';
    row.innerHTML = `
      <h4>${escapeHtml(task.title)}</h4>
      <small>${task.day} • Priority: ${task.priority} • ${task.done ? 'Done' : 'Open'}</small>
      <div class="inline-actions">
        <button data-id="${task.id}" data-action="toggle">${task.done ? 'Mark Open' : 'Mark Done'}</button>
        <button data-id="${task.id}" data-action="move">Move Day</button>
        <button data-id="${task.id}" data-action="priority">Change Priority</button>
        <button data-id="${task.id}" data-action="delete">Delete</button>
      </div>
    `;
    els.weeklyTaskList.appendChild(row);
  });

  els.weeklyTaskList.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const task = state.weeklyTasks.find((t) => t.id === btn.dataset.id);
      if (!task) return;

      if (btn.dataset.action === 'toggle') task.done = !task.done;
      if (btn.dataset.action === 'move') {
        const next = prompt('Move to day (Sunday-Saturday) or type "Unscheduled Big Rocks"', task.day);
        if (next && (DAYS.includes(next) || next === 'Unscheduled Big Rocks')) task.day = next;
      }
      if (btn.dataset.action === 'priority') {
        const next = prompt('Priority (High, Medium, Low)', task.priority);
        if (['High', 'Medium', 'Low'].includes(next)) task.priority = next;
      }
      if (btn.dataset.action === 'delete') {
        state.weeklyTasks = state.weeklyTasks.filter((t) => t.id !== task.id);
      }

      persistAndRender();
    });
  });
}

function renderDailyTasks() {
  const day = els.dailyDaySelect.value;
  const tasks = state.weeklyTasks.filter((t) => t.day === day);
  els.dailyTaskList.innerHTML = '';

  if (!tasks.length) {
    els.dailyTaskList.innerHTML = '<div class="item"><small>No tasks scheduled for this day.</small></div>';
    renderExports();
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('article');
    item.className = 'item';
    item.innerHTML = `
      <h4>${escapeHtml(task.title)}</h4>
      <small>Priority: ${task.priority} • ${task.done ? 'Done' : 'Open'}</small>
      <div class="inline-actions">
        <button data-id="${task.id}" data-action="toggle">${task.done ? 'Mark Open' : 'Mark Done'}</button>
        <button data-id="${task.id}" data-action="priority">Change Priority</button>
      </div>
    `;
    els.dailyTaskList.appendChild(item);
  });

  els.dailyTaskList.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const task = state.weeklyTasks.find((t) => t.id === btn.dataset.id);
      if (!task) return;

      if (btn.dataset.action === 'toggle') task.done = !task.done;
      if (btn.dataset.action === 'priority') {
        const next = prompt('Priority (High, Medium, Low)', task.priority);
        if (['High', 'Medium', 'Low'].includes(next)) task.priority = next;
      }
      persistAndRender();
    });
  });

  renderExports();
}

function renderEvents() {
  const day = els.dailyDaySelect.value;
  const events = state.events
    .filter((e) => e.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  els.eventList.innerHTML = '';

  events.forEach((event) => {
    const el = document.createElement('article');
    el.className = 'item';
    el.innerHTML = `
      <h4>${escapeHtml(event.title)}</h4>
      <small>${event.day} • ${event.start} - ${event.end}</small>
      <div class="inline-actions">
        <button data-id="${event.id}" data-action="delete">Delete</button>
      </div>
    `;
    els.eventList.appendChild(el);
  });

  els.eventList.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.events = state.events.filter((e) => e.id !== btn.dataset.id);
      persistAndRender();
    });
  });

  const conflicts = getEventConflicts(events);
  els.eventWarnings.textContent = conflicts.length
    ? `Conflict warning: ${conflicts.join(' | ')}`
    : '';
}

function getEventConflicts(events) {
  const warnings = [];
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i];
      const b = events[j];
      const overlap = timeToMinutes(a.start) < timeToMinutes(b.end)
        && timeToMinutes(b.start) < timeToMinutes(a.end);

      if (overlap) warnings.push(`"${a.title}" overlaps "${b.title}"`);
    }
  }
  return warnings;
}

function renderExports() {
  els.weeklyExport.textContent = buildWeeklyExport();
  els.dailyExport.textContent = buildDailyExport(els.dailyDaySelect.value);
}

function buildWeeklyExport() {
  const lines = [];
  lines.push('SEVEN HABITS WEEKLY PLAN');
  lines.push('');
  lines.push(`Mission Focus: ${state.habits.missionFocus || '-'}`);
  lines.push(`Roles: ${state.habits.rolesFocus || '-'}`);
  lines.push(`Quadrant II Priorities: ${state.habits.q2Focus || '-'}`);
  lines.push(`Reflection Prompt: ${state.habits.reflectionPrompt || '-'}`);
  lines.push('');

  DAYS.forEach((day) => {
    lines.push(`${day}:`);
    const tasks = state.weeklyTasks.filter((t) => t.day === day);
    if (!tasks.length) lines.push('  - (none)');
    tasks.forEach((t) => lines.push(`  - [${t.done ? 'x' : ' '}] (${t.priority}) ${t.title}`));
    lines.push('');
  });

  const unscheduled = state.weeklyTasks.filter((t) => t.day === 'Unscheduled Big Rocks');
  lines.push('Unscheduled Big Rocks:');
  if (!unscheduled.length) lines.push('  - (none)');
  unscheduled.forEach((t) => lines.push(`  - [${t.done ? 'x' : ' '}] (${t.priority}) ${t.title}`));

  return lines.join('\n');
}

function buildDailyExport(day) {
  const lines = [];
  lines.push(`DAILY PLAN - ${day}`);
  lines.push('');
  lines.push('Tasks:');
  const tasks = state.weeklyTasks.filter((t) => t.day === day);
  if (!tasks.length) lines.push('  - (none)');
  tasks.forEach((t) => lines.push(`  - [${t.done ? 'x' : ' '}] (${t.priority}) ${t.title}`));

  lines.push('');
  lines.push('Events:');
  const events = state.events
    .filter((e) => e.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  if (!events.length) lines.push('  - (none)');
  events.forEach((e) => lines.push(`  - ${e.start}-${e.end} ${e.title}`));

  const conflicts = getEventConflicts(events);
  if (conflicts.length) {
    lines.push('');
    lines.push('Conflict Warnings:');
    conflicts.forEach((c) => lines.push(`  - ${c}`));
  }

  return lines.join('\n');
}

function populateTimeOptions() {
  const options = timeOptions();
  options.forEach((time) => {
    const s = document.createElement('option');
    s.value = time;
    s.textContent = time;
    const e = s.cloneNode(true);
    els.eventStart.appendChild(s);
    els.eventEnd.appendChild(e);
  });

  els.eventStart.value = '09:00 AM';
  els.eventEnd.value = '09:30 AM';
}

function timeOptions() {
  const list = [];
  for (let hour = 7; hour <= 22; hour += 1) {
    for (const min of [0, 30]) {
      if (hour === 22 && min === 30) continue;
      list.push(formatTime(hour, min));
    }
  }
  return list;
}

function formatTime(hour24, minutes) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const mins = minutes.toString().padStart(2, '0');
  return `${hour12.toString().padStart(2, '0')}:${mins} ${period}`;
}

function timeToMinutes(time) {
  const [clock, period] = time.split(' ');
  let [h, m] = clock.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function dayOrder(day) {
  if (day === 'Unscheduled Big Rocks') return 8;
  return DAYS.indexOf(day);
}

function hydrateHabits() {
  els.missionFocus.value = state.habits.missionFocus || '';
  els.rolesFocus.value = state.habits.rolesFocus || '';
  els.q2Focus.value = state.habits.q2Focus || '';
  els.reflectionPrompt.value = state.habits.reflectionPrompt || '';
}


function loadDemoData() {
  state.habits = {
    missionFocus: 'Invest in key relationships while making consistent progress on meaningful work.',
    rolesFocus: 'Parent, Partner, Team Leader, Learner',
    q2Focus: 'Health, planning, and focused creation before urgency takes over.',
    reflectionPrompt: 'What one proactive choice today protects my priorities this week?'
  };

  state.weeklyTasks = [
    { id: crypto.randomUUID(), title: 'Prepare Thursday leadership briefing', day: 'Thursday', priority: 'High', done: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Family activity planning', day: 'Sunday', priority: 'Medium', done: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Strength workout x2 sessions', day: 'Tuesday', priority: 'High', done: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Review personal mission statement', day: 'Unscheduled Big Rocks', priority: 'Medium', done: false, createdAt: new Date().toISOString() }
  ];

  state.events = [
    { id: crypto.randomUUID(), title: 'Team Sync', day: 'Thursday', start: '09:00 AM', end: '09:30 AM' },
    { id: crypto.randomUUID(), title: 'Deep Work Block', day: 'Thursday', start: '09:00 AM', end: '10:00 AM' },
    { id: crypto.randomUUID(), title: 'Dentist Appointment', day: 'Thursday', start: '01:00 PM', end: '02:00 PM' }
  ];

  hydrateHabits();
  els.dailyDaySelect.value = 'Thursday';
  persistAndRender();
}

function clearAllData() {
  state.habits = { missionFocus: '', rolesFocus: '', q2Focus: '', reflectionPrompt: '' };
  state.weeklyTasks = [];
  state.events = [];
  hydrateHabits();
  els.dailyDaySelect.value = 'Sunday';
  persistAndRender();
}

function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    alert('Clipboard copy failed. You can manually copy from the text box.');
  });
}

function persistAndRender() {
  persist();
  renderWeeklyTasks();
  renderDailyTasks();
  renderEvents();
  renderExports();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const defaultState = {
    habits: {
      missionFocus: '',
      rolesFocus: '',
      q2Focus: '',
      reflectionPrompt: ''
    },
    weeklyTasks: [],
    events: []
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
