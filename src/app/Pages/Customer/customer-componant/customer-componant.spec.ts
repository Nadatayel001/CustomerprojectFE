import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerComponant } from './customer-componant';

describe('CustomerComponant', () => {
  let component: CustomerComponant;
  let fixture: ComponentFixture<CustomerComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerComponant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
