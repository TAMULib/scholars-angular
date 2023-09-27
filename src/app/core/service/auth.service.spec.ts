import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { REQUEST } from '@nguniversal/express-engine/tokens';

import { testAppConfig } from '../../../test.config';
import { getRequest } from '../../app.browser.module';
import { APP_CONFIG } from '../../app.config';
import { AuthService } from './auth.service';
import { RestService } from './rest.service';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: REQUEST, useFactory: getRequest },
        { provide: APP_CONFIG, useValue: testAppConfig },
        RestService,
        AuthService
      ],
    });
  });

  it('should be created', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));
});
