import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'scholars-data-analytics',
  templateUrl: './data-analytics.component.html',
  styleUrls: ['./data-analytics.component.scss']
})
export class DataAnalyticsComponent implements OnInit {

  public view: Observable<string>;

  constructor(
    private route: ActivatedRoute
  ) {

  }


  ngOnInit(): void {
    this.view = this.route.params.pipe(map((params) => params.view));
  }

}
