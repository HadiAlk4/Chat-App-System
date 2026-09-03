import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUser();
  if(!user)
  {
    router.navigateByUrl('/login');
    return false;
  }

  const expectedRole = route.data?.['expectedRole'];
  if(expectedRole && user.role !== expectedRole)
  {
    router.navigateByUrl('/dashboard');
    return false;
  }
  return true;
};
