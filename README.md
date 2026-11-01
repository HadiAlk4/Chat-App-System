# Chat-App-System
chat app system with smthn ig 

## Live demo (`demo` branch)

**https://hadialk4.github.io/Chat-App-System/**

A frontend-only demo with sample data: no server or database needed. The real backend route code runs inside the browser on an in-memory database (`frontend/src/demo/`), so every feature behaves as it does in the full app.

- The start screen offers a **User demo** (alex) or a **Super Admin demo** (sam); **Switch demo** (bottom left) brings it back. Other sample accounts are listed there too; every password is `Demo1234`.
- 13 sample groups with chats, members and pending requests are already set up.
- Open a second tab as another user to see live chat and request notifications.
- Changes are saved in your browser; **Reset demo data** on the start screen starts over.

Run it locally: `cd frontend && npm run start:demo`. Every push to `demo` redeploys it via `.github/workflows/demo-pages.yml`.
