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
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

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
    expect(window.alert).toHaveBeenCalledWith('Current password is incorrect');
  });
});
