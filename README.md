# Chat-App-System
chat app system with smthn ig 

## Live demo deployment

The app deploys as a single service: the backend serves the built Angular app, the API and Socket.io from one URL.

1. **Database:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Add a database user, allow network access from `0.0.0.0/0`, and copy the `mongodb+srv://...` connection string.
2. **Hosting:** on [Render](https://render.com), choose **New → Blueprint** and select this repo. `render.yaml` sets up everything; when asked, paste the Atlas string as `MONGO_URI`.
3. Open the URL Render gives you and **sign up straight away**, because the first account becomes the super admin.

Notes for the free tier: the service sleeps after ~15 min idle (first visit then takes ~30–60 s), and uploaded files are lost when it restarts or redeploys.

Local development is unchanged: `ng serve` in `frontend/` still talks to the backend on `localhost:3000`.
