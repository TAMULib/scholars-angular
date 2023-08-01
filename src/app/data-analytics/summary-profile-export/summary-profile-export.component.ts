import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { AnalyticView } from '../../core/model/view';
import { AppState } from '../../core/store';

import * as fromSdr from '../../core/store/sdr/sdr.actions';


@Component({
  selector: 'scholars-summary-profile-export',
  templateUrl: './summary-profile-export.component.html',
  styleUrls: ['./summary-profile-export.component.scss']
})
export class SummaryProfileExportComponent {

    @Input()
    public document: Observable<SolrDocument>;

    @Input()
    public analyticView: Observable<AnalyticView>;

    constructor(
      private store: Store<AppState>
    ) {

    }

    public downloadSummary(document: SolrDocument, analyticView: AnalyticView) {
      this.store.dispatch(new fromSdr.DownloadProfileSummary('individual', {
        id: document.id,
        type: analyticView.type,
        name: analyticView.name
      }));

    }

}
