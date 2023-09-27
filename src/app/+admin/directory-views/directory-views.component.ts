import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SdrPage } from '../../core/model/sdr';
import { DirectoryView } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectAllResources, selectResourcesPage } from '../../core/store/sdr';

@Component({
  selector: 'scholars-directory-views',
  templateUrl: './directory-views.component.html',
  styleUrls: ['./directory-views.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DirectoryViewsComponent implements OnInit {

  public directoryViews: Observable<DirectoryView[]>;

  public page: Observable<SdrPage>;

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    this.directoryViews = this.store.pipe(select(selectAllResources<DirectoryView>('directoryViews')));
    this.page = this.store.pipe(select(selectResourcesPage<DirectoryView>('directoryViews')));
  }

}
