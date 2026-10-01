import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('calculates a positive age for a past date of birth', () => {
    expect(component.calculateAge('2000-01-01')).toBeGreaterThan(18);
  });

  it('returns -1 when the date of birth is empty', () => {
    expect(component.calculateAge('')).toBe(-1);
  });

  it('returns a negative age for a future date of birth', () => {
    expect(component.calculateAge('2099-01-01')).toBeLessThan(0);
  });

  it('does not post when the form is empty', () => {
    const http = TestBed.inject(HttpClient);
    const post = vi.spyOn(http, 'post');

    component.registerUser();

    expect(post).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please fill in all required fields.');
  });

  it('does not post a password that breaks the password rule', () => {
    const http = TestBed.inject(HttpClient);
    const post = vi.spyOn(http, 'post');
    component.usernameInput = 'ada';
    component.emailInput = 'ada@example.com';
    component.passwordInput = 'password1';
    component.dobInput = '2000-01-01';

    component.registerUser();

    expect(post).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('at least one uppercase letter');
  });

  it('does not post an invalid email address', () => {
    const http = TestBed.inject(HttpClient);
    const post = vi.spyOn(http, 'post');
    component.usernameInput = 'ada';
    component.emailInput = 'not-an-email';
    component.passwordInput = 'Password1';
    component.dobInput = '2000-01-01';

    component.registerUser();

    expect(post).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Please enter a valid email address.');
  });
});
