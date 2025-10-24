import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerListComponant } from './customer-list-componant';

describe('CustomerListComponant', () => {
  let component: CustomerListComponant;
  let fixture: ComponentFixture<CustomerListComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerListComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerListComponant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
