import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { RequestHistory } from './request-history';

describe('RequestHistory', () => {
  let fixture: ComponentFixture<RequestHistory>;

  beforeEach(async () => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'ada', email: 'ada@example.com', role: 'user' })
    );

    await TestBed.configureTestingModule({
      imports: [RequestHistory],
      providers: [
        {
          provide: GroupService,
          useValue: {
            getJoinRequests: vi.fn(() =>
              of([
                {
                  _id: '1',
                  groupName: 'Readers',
                  username: 'ada',
                  age: 26,
                  userEmail: 'ada@example.com',
                  status: 'pending',
                  createdAt: '2026-01-01T00:00:00.000Z',
                },
              ])
            ),
            getRoomRequests: vi.fn(() => of([])),
            getGroupBanRequests: vi.fn(() => of([])),
            getGroups: vi.fn(() => of([])),
          },
        },
        {
          provide: SocketService,
          useValue: {
            onJoinRequestResolved: () => EMPTY,
            onRoomRequestResolved: () => EMPTY,
            onGroupBanRequestCreated: () => EMPTY,
            onGroupBanRequestResolved: () => EMPTY,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestHistory);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the mocked join request', () => {
    expect(fixture.nativeElement.textContent).toContain('Readers');
  });
});
