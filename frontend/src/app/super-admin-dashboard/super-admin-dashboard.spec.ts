import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AccountService } from '../services/account';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { SuperAdminDashboard } from './super-admin-dashboard';

describe('SuperAdminDashboard', () => {
  let fixture: ComponentFixture<SuperAdminDashboard>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'root', email: 'root@example.com', role: 'super-admin' })
    );

    await TestBed.configureTestingModule({
      imports: [SuperAdminDashboard],
      providers: [
        {
          provide: GroupService,
          useValue: {
            getPendingRequests: vi.fn(() =>
              of([
                {
                  _id: '1',
                  groupName: 'Readers',
                  groupDescription: 'Books',
                  minAge: 18,
                  themeColor: 'light',
                  creatorUserName: 'ada',
                  creatorEmail: 'ada@example.com',
                  status: 'pending',
                },
              ])
            ),
            getGroupBanRequests: vi.fn(() => of([])),
            getGroupDeletionRequests: vi.fn(() => of([])),
          },
        },
        {
          provide: AccountService,
          useValue: {
            getPendingDeletionRequests: vi.fn(() => of([])),
            getBannedEmails: vi.fn(() => of([])),
          },
        },
        {
          provide: SocketService,
          useValue: {
            onGroupRequestCreated: () => of(),
            onGroupRequestResolved: () => of(),
            onGroupBanRequestCreated: () => of(),
            onGroupBanRequestResolved: () => of(),
            onGroupDeletionRequestCreated: () => of(),
            onGroupDeletionRequestResolved: () => of(),
            onAccountDeletionRequestCreated: () => of(),
            onAccountDeletionRequestResolved: () => of(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperAdminDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders pending group proposals from the group service', () => {
    expect(fixture.nativeElement.textContent).toContain('Readers');
  });
});
