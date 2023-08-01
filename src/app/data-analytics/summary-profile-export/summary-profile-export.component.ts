import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SolrDocument } from 'src/app/core/model/discovery';
import { AppState } from 'src/app/core/store';

@Component({
  selector: 'scholars-summary-profile-export',
  templateUrl: './summary-profile-export.component.html',
  styleUrls: ['./summary-profile-export.component.scss']
})
export class SummaryProfileExportComponent {

    @Input()
    public document: Observable<SolrDocument>;

    constructor(
      private store: Store<AppState>
    ) {

    }

    public downloadSummary() {
      console.log("Download Summary");

    }



}
