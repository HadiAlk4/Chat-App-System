import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountDeletionRequest } from '../models/account-deletion-request';
import { BannedEmail } from '../models/banned-email';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private http: HttpClient) {}

  requestAccountDeletion(username: string): Observable<{ ok: boolean; message: string; request?: AccountDeletionRequest }> {
    return this.http.post<{ ok: boolean; message: string; request?: AccountDeletionRequest }>(
      `${API_URL}/account-deletion-requests`,
      { username }
    );
  }

  getDeletionRequests(params: { username?: string; status?: string } = {}): Observable<AccountDeletionRequest[]> {
    return this.http.get<AccountDeletionRequest[]>(`${API_URL}/account-deletion-requests`, { params });
  }

  getPendingDeletionRequests(): Observable<AccountDeletionRequest[]> {
    return this.getDeletionRequests({ status: 'pending' });
  }

  approveDeletion(requestId: string): Observable<{ ok: boolean; message: string }> {
    return this.http.patch<{ ok: boolean; message: string }>(
      `${API_URL}/account-deletion-requests/${requestId}/approve`,
      {}
    );
  }

  rejectDeletion(requestId: string, reason: string): Observable<{ ok: boolean; message: string }> {
    return this.http.patch<{ ok: boolean; message: string }>(
      `${API_URL}/account-deletion-requests/${requestId}/reject`,
      { reason }
    );
  }

  getBannedEmails(): Observable<BannedEmail[]> {
    return this.http.get<BannedEmail[]>(`${API_URL}/banned-emails`);
  }

  updateUsername(email: string, newUsername: string): Observable<{ ok: boolean; message: string; user?: any }> {
    return this.http.patch<{ ok: boolean; message: string; user?: any }>(
      `${API_URL}/users/username`,
      { email, newUsername }
    );
  }

  updatePassword(email: string, currentPassword: string, newPassword: string): Observable<{ ok: boolean; message: string }> {
    return this.http.patch<{ ok: boolean; message: string }>(
      `${API_URL}/users/password`,
      { email, currentPassword, newPassword }
    );
  }

  updateTheme(email: string, isDarkMode: boolean): Observable<{ ok: boolean; message: string; user?: any }> {
    return this.http.patch<{ ok: boolean; message: string; user?: any }>(
      `${API_URL}/users/theme`,
      { email, isDarkMode }
    );
  }
}
