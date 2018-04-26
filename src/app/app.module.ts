import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


import {
  FileUploadModule,
  FileSelectDirective,
  FileDropDirective
} from 'ng2-file-upload';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TinySpinnerComponent } from './tiny-spinner/tiny-spinner.component';
import { ModalService } from './services/modal.service';
import { XlsxImportEditorComponent } from './components/xlsx-import-editor/xlsx-import-editor.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SheetNameEditorComponent } from './components/sheet-name-editor/sheet-name-editor.component';
import {HttpClientModule} from '@angular/common/http';
import {InvestmentTreeHelperService} from './services/investment-tree-helper.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import { routes } from './routes';



@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TinySpinnerComponent,
    XlsxImportEditorComponent,
    SheetNameEditorComponent
  ],
  imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule,  RouterModule.forRoot(routes),  FormsModule, ReactiveFormsModule, FileUploadModule, NgbModule.forRoot(), ToastrModule.forRoot()],
  providers: [ModalService, InvestmentTreeHelperService],
  entryComponents: [ XlsxImportEditorComponent, SheetNameEditorComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
