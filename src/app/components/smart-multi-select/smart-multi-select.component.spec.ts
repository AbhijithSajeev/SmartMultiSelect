import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartMultiSelectComponent } from './smart-multi-select.component';
import {FormsModule} from '@angular/forms';

describe('SmartMultiSelectComponent', () => {
  let component: SmartMultiSelectComponent;
  let fixture: ComponentFixture<SmartMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmartMultiSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
