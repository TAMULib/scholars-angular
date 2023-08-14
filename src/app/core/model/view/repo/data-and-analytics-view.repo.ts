import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { AbstractSdrRepo } from '../../sdr/repo';
import { ViewRepo } from './view.repo';

import { DataAndAnalyticsView } from '..';
import { SdrRequest } from '../../request';
import { Count, SdrCollection } from '../../sdr';

@Injectable({
  providedIn: 'root',
})
export class DataAndAnalyticsViewRepo extends AbstractSdrRepo<DataAndAnalyticsView> implements ViewRepo<DataAndAnalyticsView> {
  protected path(): string {
    return 'dataAndAnalyticsViews';
  }

  public search(request: SdrRequest): Observable<SdrCollection> {
    throw new Error('Data And Analytics Views does not support faceted search!');
  }

  public count(request: SdrRequest): Observable<Count> {
    throw new Error('Data And Analytics Views does not support count!');
  }

  public findByTypesIn(types: string[]): Observable<DataAndAnalyticsView> {
    throw new Error('Data And Analytics Views does not support find by types in!');
  }

  public findByIdIn(ids: string[]): Observable<SdrCollection> {
    throw new Error('Data And Analytics Views does not support find by id in!');
  }
}
