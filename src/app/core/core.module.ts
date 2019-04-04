import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthGuard } from './guard/auth.guard';
import { AuthService } from './service/auth.service';
import { RestService } from './service/rest.service';
import { ThemeService } from './service/theme.service';
import { StompService } from './service/stomp.service';
import { MetadataService } from './service/metadata.service';

import { ThemeRepo } from './model/theme/repo/theme.repo';
import { UserRepo } from './model/user/repo/user.repo';
import { AlertService } from './service/alert.service';
import { DialogService } from './service/dialog.service';
import { TemplateService } from './service/template.service';

const MODULES = [
    CommonModule
];

const COMPONENTS = [

];

const PROVIDERS = [
    AuthGuard,
    AlertService,
    AuthService,
    DialogService,
    MetadataService,
    RestService,
    TemplateService,
    StompService,
    ThemeService,
    ThemeRepo,
    UserRepo
];

@NgModule({
    imports: [
        ...MODULES
    ],
    exports: [
        ...COMPONENTS
    ],
    declarations: [
        ...COMPONENTS
    ],
    providers: [
        ...PROVIDERS
    ]
})
export class CoreModule {

    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: CoreModule,
            providers: [
                ...PROVIDERS
            ]
        };
    }

    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule is already loaded. Import it in the AppModule only');
        }
    }

}
