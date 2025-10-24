import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponant } from './login-componant';

describe('LoginComponant', () => {
  let component: LoginComponant;
  let fixture: ComponentFixture<LoginComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
