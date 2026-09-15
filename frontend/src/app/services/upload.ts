import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private http: HttpClient) {}

  uploadAvatar(file: File, username: string): Observable<{ ok: boolean; profilePictureUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('username', username);
    return this.http.post<{ ok: boolean; profilePictureUrl: string; message: string }>(
      `${API_URL}/upload/avatar`,
      formData
    );
  }

  uploadChatImage(file: File): Observable<{ ok: boolean; fileUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ ok: boolean; fileUrl: string }>(
      `${API_URL}/upload/chat`,
      formData
    );
  }
}
