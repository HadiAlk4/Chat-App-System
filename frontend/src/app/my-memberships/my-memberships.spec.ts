import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GroupService } from '../services/group';
import { MyMemberships } from './my-memberships';

describe('MyMemberships', () => {
  let fixture: ComponentFixture<MyMemberships>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'ada', email: 'ada@example.com', role: 'user' })
    );

    await TestBed.configureTestingModule({
      imports: [MyMemberships],
      providers: [
        {
          provide: GroupService,
          useValue: {
            getUserMemberships: vi.fn(() =>
              of([
                {
                  groupName: 'Readers',
                  groupDescription: 'Books',
                  minAge: 18,
                  themeColor: 'light',
                  admins: ['ada'],
                  members: ['ada'],
                },
              ])
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyMemberships);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders the mocked membership', () => {
    expect(fixture.nativeElement.textContent).toContain('Readers');
  });
});
