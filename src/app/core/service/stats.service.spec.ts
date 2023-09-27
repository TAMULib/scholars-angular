import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { REQUEST } from '@nguniversal/express-engine/tokens';

import { testAppConfig } from '../../../test.config';
import { getRequest } from '../../app.browser.module';
import { APP_CONFIG } from '../../app.config';
import { RestService } from './rest.service';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: APP_CONFIG, useValue: testAppConfig },
        { provide: REQUEST, useFactory: getRequest },
        StatsService,
        RestService
      ]
    });
  });

  it('should be created', inject([StatsService], (service: StatsService) => {
    expect(service).toBeTruthy();
  }));
});
