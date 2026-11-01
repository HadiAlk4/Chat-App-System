// Entry point for the hard-coded demo build (`npm run build:demo`).
// The shim must load before anything from ../backend reads process.env.
import './demo/shims/process';
import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { demoBackendInterceptor } from './demo/interceptor';
import { backendReady } from './demo/backend';
import { mountDemoPanel } from './demo/demo-panel';

const demoConfig = mergeApplicationConfig(appConfig, {
  providers: [
    provideHttpClient(withInterceptors([demoBackendInterceptor])),
    // #/routes work on any static host (GitHub Pages, a sub-folder, ...) without server rewrites.
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
});

backendReady
  .then(() => bootstrapApplication(App, demoConfig))
  .then(() => mountDemoPanel())
  .catch((err) => console.error(err));
