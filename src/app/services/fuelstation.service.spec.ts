import { TestBed } from '@angular/core/testing';

import { FuelStationService } from './fuelstation.service';

describe('FuelStationService', () => {
  let service: FuelStationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FuelStationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
