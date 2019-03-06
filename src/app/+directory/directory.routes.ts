import { Routes } from '@angular/router';

import { DirectoryComponent } from './directory.component';

export const routes: Routes = [
    {
        path: ':collection', component: DirectoryComponent, pathMatch: 'full'
    },
    { path: '**', redirectTo: 'persons' }
];
