import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditLog } from '../models/audit-log';
import { AuditService } from '../services/audit';
import { SuperAdminAuditLog } from './super-admin-audit-log';

const logs: AuditLog[] = [
  {
    _id: '1',
    timeStamp: '2026-01-15T00:00:00.000Z',
    actionPerformed: 'Accepted Group Creation',
    target: 'Readers',
  },
  {
    _id: '2',
    timeStamp: '2026-03-02T00:00:00.000Z',
    actionPerformed: 'Accepted Group Deletion',
    target: 'Poets',
  },
];

describe('SuperAdminAuditLog', () => {
  let fixture: ComponentFixture<SuperAdminAuditLog>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'root', email: 'root@example.com', role: 'super-admin' })
    );

    await TestBed.configureTestingModule({
      imports: [SuperAdminAuditLog],
      providers: [
        {
          provide: AuditService,
          useValue: {
            getLogs: vi.fn((params: { action?: string; startDate?: string }) => {
              const filtered = logs.filter((log) => {
                const actionMatches =
                  !params.action || params.action === 'All Actions' || log.actionPerformed === params.action;
                const dateMatches = !params.startDate || String(log.timeStamp) >= params.startDate;
                return actionMatches && dateMatches;
              });
              return of(filtered);
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperAdminAuditLog);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function tableText(): string {
    return fixture.nativeElement.querySelector('tbody').textContent;
  }

  it('applies the action and date filters to the mocked list', async () => {
    const component = fixture.componentInstance;
    component.selectedAction = 'Accepted Group Deletion';
    component.startDate = '2026-02-01';

    component.applyFilters();
    fixture.componentRef.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(tableText()).toContain('Accepted Group Deletion');
    expect(tableText()).not.toContain('Accepted Group Creation');
  });
});
