import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuperAdminAuditLog } from './super-admin-audit-log';

describe('SuperAdminAuditLog', () => {
  let component: SuperAdminAuditLog;
  let fixture: ComponentFixture<SuperAdminAuditLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperAdminAuditLog],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperAdminAuditLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
