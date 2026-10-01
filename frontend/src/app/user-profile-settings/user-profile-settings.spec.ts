import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccountService } from '../services/account';
import { UserProfileSettings } from './user-profile-settings';

describe('UserProfileSettings', () => {
  let fixture: ComponentFixture<UserProfileSettings>;
  let updatePassword: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({
        username: 'ada',
        email: 'ada@example.com',
        role: 'user',
        dob: '2000-01-01',
      })
    );
    updatePassword = vi.fn(() => of({ ok: false, message: 'Current password is incorrect' }));

    await TestBed.configureTestingModule({
      imports: [UserProfileSettings],
      providers: [{ provide: AccountService, useValue: { updatePassword } }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileSettings);
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows the service error when the current password is wrong', () => {
    const component = fixture.componentInstance;
    component.currentPasswordInput = 'WrongPass1';
    component.newPasswordInput = 'Password2';
    component.confirmPasswordInput = 'Password2';

    component.savePassword();

    expect(updatePassword).toHaveBeenCalledWith('ada@example.com', 'WrongPass1', 'Password2');
    expect(component.passwordMessage()).toEqual({ type: 'danger', text: 'Current password is incorrect' });
  });

  it('does not call the API when the new password breaks the password rule', () => {
    const component = fixture.componentInstance;
    component.currentPasswordInput = 'Password1';
    component.newPasswordInput = 'short';
    component.confirmPasswordInput = 'short';

    component.savePassword();

    expect(updatePassword).not.toHaveBeenCalled();
    expect(component.passwordMessage()?.type).toBe('danger');
  });
});
