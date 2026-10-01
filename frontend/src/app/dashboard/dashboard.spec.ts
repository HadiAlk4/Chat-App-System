import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GroupService } from '../services/group';
import { PendingRequestsService } from '../services/pending-requests';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let submitProposal: ReturnType<typeof vi.fn>;
  let getGroups: ReturnType<typeof vi.fn>;
  let pendingCount: ReturnType<typeof signal<number>>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'ada', email: 'ada@example.com', role: 'user' })
    );
    submitProposal = vi.fn(() => of({ ok: true, message: 'Group request submitted successfully' }));
    getGroups = vi.fn(() => of([]));
    pendingCount = signal(0);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: GroupService,
          useValue: {
            getGroups,
            submitProposal,
          },
        },
        {
          provide: PendingRequestsService,
          useValue: { pendingCount, track: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('sends a named proposal through the group service', () => {
    const component = fixture.componentInstance;
    component.newGroup = {
      groupName: 'Readers',
      groupDescription: 'Books',
      minAge: 18,
      themeColor: 'light',
    };

    const proposal = { ...component.newGroup };

    component.proposeGroup();

    expect(submitProposal).toHaveBeenCalledWith(proposal, 'ada', 'ada@example.com');
  });

});
