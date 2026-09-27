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
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
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
    expect(window.alert).toHaveBeenCalledWith('Please fill in all required fields.');
  });
});
