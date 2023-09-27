import { DOCUMENT } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { REQUEST } from '@nguniversal/express-engine/tokens';

import { testAppConfig } from '../../../test.config';
import { createStyleLoader, getRequest } from '../../app.browser.module';
import { APP_CONFIG } from '../../app.config';
import { ComputedStyleLoader } from '../computed-style-loader';
import { RestService } from './rest.service';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: REQUEST, useFactory: getRequest },
        { provide: APP_CONFIG, useValue: testAppConfig },
        { provide: ComputedStyleLoader, useFactory: createStyleLoader, deps: [DOCUMENT] },
        RestService,
        ThemeService,
      ],
    });
  });

  it('should be created', inject([ThemeService], (service: ThemeService) => {
    expect(service).toBeTruthy();
  }));
});
