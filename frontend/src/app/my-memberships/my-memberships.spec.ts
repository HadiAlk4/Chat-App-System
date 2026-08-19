import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMemberships } from './my-memberships';

describe('MyMemberships', () => {
  let component: MyMemberships;
  let fixture: ComponentFixture<MyMemberships>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMemberships],
    }).compileComponents();

    fixture = TestBed.createComponent(MyMemberships);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
