import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log';
import { environment } from '../../environments/environment';

const API_URL = `${environment.backendUrl}/api`;

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  constructor(private http: HttpClient) {}

  getLogs(params: { action?: string; startDate?: string; endDate?: string } = {}): Observable<AuditLog[]> {
    const query: Record<string, string> = {};
    if (params.action) query['action'] = params.action;
    if (params.startDate) query['startDate'] = params.startDate;
    if (params.endDate) query['endDate'] = params.endDate;

    return this.http.get<AuditLog[]>(`${API_URL}/audit-logs`, { params: query });
  }
}
