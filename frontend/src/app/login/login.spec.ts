import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('shows an error and does not call HTTP when the fields are empty', async () => {
    const http = TestBed.inject(HttpClient);
    const post = vi.spyOn(http, 'post');

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Please enter both email and password.');
    expect(post).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Please enter both email and password.');
  });

  it('navigates a regular user to the dashboard after a successful login', () => {
    const http = TestBed.inject(HttpClient);
    vi.spyOn(http, 'post').mockReturnValue(
      of({ ok: true, valid: true, user: { username: 'ada', role: 'user', email: 'ada@example.com' } })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.emailInput = 'ada@example.com';
    component.passwordInput = 'Password1';
    component.loginfunc();

    expect(http.post).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates a super admin to the super admin dashboard', () => {
    const http = TestBed.inject(HttpClient);
    vi.spyOn(http, 'post').mockReturnValue(
      of({
        ok: true,
        valid: true,
        user: { username: 'root', role: 'super-admin', email: 'root@example.com' },
      })
    );
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.emailInput = 'root@example.com';
    component.passwordInput = 'Password1';
    component.loginfunc();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/super-admin-dashboard');
  });
});
