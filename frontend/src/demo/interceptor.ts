import { HttpEvent, HttpInterceptorFn, HttpParams, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { handle } from './backend';
import { resolveUploads } from './uploads';

/** Sends every /api request to the in-browser backend instead of the network. */
export const demoBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.urlWithParams, window.location.href);
  const apiIndex = url.pathname.indexOf('/api/');
  if (apiIndex === -1) return next(req);

  return new Observable<HttpEvent<unknown>>((subscriber) => {
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (query[k] = v));
    const params: HttpParams = req.params;
    for (const key of params.keys()) query[key] = params.get(key)!;

    const isForm = req.body instanceof FormData;
    const body = isForm
      ? Object.fromEntries([...(req.body as FormData).entries()].filter(([, v]) => typeof v === 'string'))
      : req.body ?? {};

    let cancelled = false;
    handle({
      method: req.method,
      path: url.pathname.slice(apiIndex),
      query,
      body: JSON.parse(JSON.stringify(body)),
      formData: isForm ? (req.body as FormData) : undefined,
    }).then(({ status, body: responseBody }) => {
      if (cancelled) return;
      const payload = resolveUploads(responseBody);
      if (status >= 400) {
        subscriber.error(new HttpErrorResponse({ status, error: payload, url: req.url }));
      } else {
        subscriber.next(new HttpResponse({ status, body: payload, url: req.url }));
        subscriber.complete();
      }
    });
    return () => { cancelled = true; };
  });
};
