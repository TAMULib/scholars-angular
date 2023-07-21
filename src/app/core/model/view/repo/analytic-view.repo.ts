import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { AbstractSdrRepo } from '../../sdr/repo';
import { ViewRepo } from './view.repo';

import { AnalyticView } from '..';
import { SdrCollection, Count } from '../../sdr';
import { SdrRequest } from '../../request';

@Injectable({
  providedIn: 'root',
})
export class AnalyticViewRepo extends AbstractSdrRepo<AnalyticView> implements ViewRepo<AnalyticView> {
  protected path(): string {
    return 'analyticViews';
  }

  public search(request: SdrRequest): Observable<SdrCollection> {
    throw new Error('Analytic Views does not support search!');
  }

  public count(request: SdrRequest): Observable<Count> {
    throw new Error('Analytic Views does not support count!');
  }

  public findByTypesIn(types: string[]): Observable<AnalyticView> {
    throw new Error('Analytic Views does not support find by types in!');
  }

  public findByIdIn(ids: string[]): Observable<SdrCollection> {
    throw new Error('Analytic Views does not support find by id in!');
  }
}
