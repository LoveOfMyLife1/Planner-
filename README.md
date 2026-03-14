# Seven Habits Weekly Planner

A single-user, local planner you can run in your browser with:
- Seven Habits weekly structure (mission, roles, Quadrant II, reflection)
- Weekly tasks that sync into daily task views
- Unscheduled Big Rocks
- Separate daily events (calendar appointments) with 30-minute times from 7:00 AM to 10:00 PM
- Conflict warnings for overlapping events
- Copy-ready weekly and daily text for OneNote

## Quick start

1. Open a terminal in this folder.
2. Start a local server:

```bash
python -m http.server 4173
```

3. Open `http://localhost:4173` in your browser.

## See it demonstrated quickly

Use the **Getting Started** card at the top:
- Click **Load Demo Week** to prefill a full sample week (including a conflict warning example).
- Change the day selector to see synced daily tasks.
- Click **Copy Weekly Plan** or **Copy Daily Plan** and paste into OneNote.
- Click **Clear All Planner Data** to reset.

## Your planning workflow

1. Fill in your weekly focus under **Seven Habits Weekly Planning** and click **Save Weekly Focus**.
2. Add weekly tasks and assign each one to a day (or add as **Unscheduled Big Rock**).
3. Use **Daily Tasks (Synced from Weekly Plan)** to check off and reprioritize tasks for the selected day.
4. Add separate events under **Daily Schedule Events** with start and end times.
5. Watch for event overlap warnings.
6. Copy your weekly/daily output for OneNote.

## Data storage

This planner stores data in your browser `localStorage` only (no backend, no account).
