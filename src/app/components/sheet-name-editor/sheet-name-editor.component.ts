import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FileLikeObject} from 'ng2-file-upload';
import {AppConstant} from '../../app-constant';
import {WorkBook} from 'xlsx';
import { Workbook } from '../../types/workbook';
import * as XLSX from 'xlsx';
import { XlsxImportEditorComponent } from '../xlsx-import-editor/xlsx-import-editor.component';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-sheet-name-editor',
  templateUrl: './sheet-name-editor.component.html',
  styleUrls: ['./sheet-name-editor.component.css']
})
export class SheetNameEditorComponent extends XlsxImportEditorComponent {

  constructor(activeModal: NgbActiveModal, toastr: ToastrService) {
    super(activeModal, toastr);
  }
}
