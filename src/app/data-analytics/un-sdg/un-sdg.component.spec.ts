import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnSdgComponent } from './un-sdg.component';

describe('UnSdgComponent', () => {
  let component: UnSdgComponent;
  let fixture: ComponentFixture<UnSdgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UnSdgComponent]
    });
    fixture = TestBed.createComponent(UnSdgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
