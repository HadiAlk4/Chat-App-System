import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

const testProviders = [provideRouter(routes), provideHttpClient()];

export default testProviders;
