import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, take } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { SidebarItemType, SidebarMenu } from '../../core/model/sidebar';
import { DataAndAnalyticsView, DisplayView, ExportView } from '../../core/model/view';
import { AppState } from '../../core/store';

import * as fromSidebar from '../../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-profile-summaries-export',
  templateUrl: './profile-summaries-export.component.html',
  styleUrls: ['./profile-summaries-export.component.scss']
})
export class ProfileSummariesExportComponent implements OnInit {

  @Input()
  public document: Observable<SolrDocument>;

  @Input()
  public displayView: Observable<DisplayView>;

  @Input()
  public dataAndAnalyticsView: Observable<DataAndAnalyticsView>;

  public selected: Observable<ExportView>;

  public selectedExportView: BehaviorSubject<ExportView>;

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    this.selectedExportView = new BehaviorSubject<ExportView>(undefined);
    this.route.queryParams.subscribe((queryParams: Params) => {

      this.displayView.pipe(take(1)).subscribe((displayView: DisplayView) => {

        const menu: SidebarMenu = {
          sections: [
            {
              title: 'Time Period',
              items: displayView.exportViews.map((exportView: ExportView) => {
                const selected = exportView.name === queryParams.export;

                if (selected) {
                  this.selectedExportView.next(exportView);
                }

                return {
                  label: exportView.name,
                  type: SidebarItemType.LINK,
                  route: ['./'],
                  queryParams: {
                    export: exportView.name
                  },
                  selected
                }
              }),
              collapsed: false,
              collapsible: false,
              expandable: false,
              useDialog: false
            }
          ]
        };

        this.store.dispatch(new fromSidebar.LoadSidebarAction({ menu }));
      });
    });
  }

  public getSelectedExportView(): Observable<ExportView> {
    return this.selectedExportView.asObservable();
  }

  public getDownloadLink(document: SolrDocument, exportView: ExportView): string {
    const link = exportView.name.toLowerCase().replace(/ /g, '_');
    return document._links[link].href;
  }

}
