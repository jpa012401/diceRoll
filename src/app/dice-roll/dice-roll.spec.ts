import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceRoll } from './dice-roll';

describe('DiceRoll', () => {
  let component: DiceRoll;
  let fixture: ComponentFixture<DiceRoll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceRoll]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceRoll);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
