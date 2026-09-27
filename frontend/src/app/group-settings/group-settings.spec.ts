import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { GroupSettings } from './group-settings';

describe('GroupSettings', () => {
  let fixture: ComponentFixture<GroupSettings>;
  let rejectJoinRequest: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'ada', email: 'ada@example.com', role: 'group-admin' })
    );
    rejectJoinRequest = vi.fn(() => of({ ok: true, message: 'rejected' }));
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [GroupSettings],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        {
          provide: GroupService,
          useValue: {
            getGroupByName: vi.fn(() => of({ ok: false })),
            getJoinRequests: vi.fn(() => of([])),
            getRoomRequests: vi.fn(() => of([])),
            getGroupBanRequests: vi.fn(() => of([])),
            rejectJoinRequest,
          },
        },
        {
          provide: SocketService,
          useValue: {
            onJoinRequestCreated: () => EMPTY,
            onJoinRequestResolved: () => EMPTY,
            onRoomRequestCreated: () => EMPTY,
            onRoomRequestResolved: () => EMPTY,
            onGroupBanRequestCreated: () => EMPTY,
            onGroupBanRequestResolved: () => EMPTY,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSettings);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not call the API when a join rejection has no reason', () => {
    fixture.componentInstance.joinRequests = [
      {
        _id: '1',
        groupName: 'Readers',
        username: 'bea',
        age: 20,
        userEmail: 'bea@example.com',
        status: 'pending',
        createdAt: '2026-01-01T00:00:00.000Z',
        rejectReason: '   ',
      },
    ];

    fixture.componentInstance.rejectRequest(0);

    expect(rejectJoinRequest).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('A rejection reason is required');
  });
});
