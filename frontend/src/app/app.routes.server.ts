import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'signup', renderMode: RenderMode.Prerender },
  // The signed-in user lives in the tab's sessionStorage, which only exists in the browser,
  // so protected routes must run their auth guard client-side.
  { path: '**', renderMode: RenderMode.Client }
];
