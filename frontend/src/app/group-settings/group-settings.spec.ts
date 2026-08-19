import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSettings } from './group-settings';

describe('GroupSettings', () => {
  let component: GroupSettings;
  let fixture: ComponentFixture<GroupSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
