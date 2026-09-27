import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function run(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      authGuard(route as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  it('sends a logged-out visitor to the login page', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(AuthService), 'getUser').mockReturnValue(null);

    expect(run({})).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('sends a user away from a super admin page', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(AuthService), 'getUser').mockReturnValue({
      username: 'ada',
      role: 'user',
    });

    expect(run({ data: { expectedRole: 'super-admin' } })).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('sends a super admin away from chat', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(AuthService), 'getUser').mockReturnValue({
      username: 'root',
      role: 'super-admin',
    });

    expect(run({ routeConfig: { path: 'chat' } })).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/super-admin-dashboard');
  });
});
