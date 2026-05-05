# Master Task Planner Sync Setup

The app can sync if you give it a cloud URL that supports:

- `GET` to read the current JSON
- `PUT` to save the current JSON
- CORS requests from the browser

## Option: Cloudflare Worker + KV

1. Create a Cloudflare Worker.
2. Create a KV namespace named `TASK_PLANNER`.
3. Bind that KV namespace to the Worker as `TASK_PLANNER`.
4. Add a Worker secret named `SYNC_KEY` with a private phrase.
5. Use the code in `cloudflare-worker-sync.js`.
6. Deploy the Worker.
7. In the app, click **Sync** and enter:
   - **Sync URL**: your Worker URL, such as `https://task-planner-sync.yourname.workers.dev`
   - **Optional sync key**: the same value as the Worker `SYNC_KEY`
   - Turn on auto-sync if desired.
8. Click **Push** from the device that has the task list you want to seed into the cloud.
9. Open the app on Android, enter the same sync settings, then click **Pull**.

## Notes

- The GitHub Pages app shell is public.
- Do not embed private task data in this repository.
- Task data syncs only through the configured sync endpoint.
- If two devices edit at the same time, the latest push wins.
