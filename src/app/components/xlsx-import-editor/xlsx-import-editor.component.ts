import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FileLikeObject} from 'ng2-file-upload';
import {AppConstant} from '../../app-constant';
import * as XLSX from 'xlsx';
import {WorkBook} from 'xlsx';
import { Workbook } from '../../types/workbook';
import {ToastrService} from 'ngx-toastr';


@Component({
  selector: 'app-xlsx-import-editor',
  templateUrl: './xlsx-import-editor.component.html',
  styleUrls: ['./xlsx-import-editor.component.css']
})
export class XlsxImportEditorComponent implements OnInit {
  activeModal: NgbActiveModal;
  file: FileLikeObject;
  isLoanFile: boolean;
  htmlTables = [];
  workbook: WorkBook;
  sheetNameOptions: [string];
  sheetNameAlias = {};
  @Input() params: any;
  isProcessing: false;
  toastr: ToastrService;


  constructor(activeModal: NgbActiveModal, toastr: ToastrService) {
    this.sheetNameOptions = AppConstant.SHEET_NAME_OPTIONS;
    this.activeModal = activeModal;
    this.toastr = toastr;

  }

  ngOnInit() {
    if (this.params &&  this.params.file) {
      this.file = this.params.file;
      this.isLoanFile = this.params.isLoanFile;
      this.startProcessFile(this.file);
    }
  }



  protected submit() {
    const self = this;
    if (Array.isArray(this.htmlTables)) {
      const inValidSheetName = this.htmlTables.find(function(sheetName) {
        return typeof sheetName === 'undefined' || sheetName === 'Sheet1' || sheetName === null || sheetName === '';
      });

      if (inValidSheetName) {
        return this.toastr.error('Not a valid sheet name. Please choose appropriate sheet name.');
      }

      const wb = new Workbook();
      self.workbook.SheetNames.forEach(function(sheetName, index) {
        const aliasName = self.sheetNameAlias[sheetName] || `Sheet${index}`;
        wb.SheetNames.push(aliasName);
        wb.Sheets[aliasName] =  self.workbook.Sheets[sheetName];
      });

      const {modifiedFileName, modifiedFile} = this.makeXlsxFile(wb, self);
      this.file = new FileLikeObject(modifiedFile);
      this.file.name  =  modifiedFileName + '.xlsx';
    }
    this.activeModal.close({file: this.file});
  }

  protected makeXlsxFile(wb, self) {
    const wbout = XLSX.write(wb, {cellDates: true, type: 'binary', bookSST: false, bookType: 'xlsx'});
    const s2ab = function (s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i !== s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    };
    const modifiedFileName = self.file.name.substring(0, self.file.name.lastIndexOf('.'));
    const modifiedFile = new Blob([s2ab(wbout)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return {modifiedFileName, modifiedFile};
  }



  protected startProcessFile(file) {
    const self = this;
    let reader: FileReader;
    reader = new FileReader();
    reader.onload = function(e: any) {
      const data = e.target.result;
      function doitnow() {
        try {
          const wb = self.readXlsFileData(data);
          self.process_wb(wb);
        } catch (e) {
          console.log(e);
        }
      }
      doitnow();
    };
    reader.readAsBinaryString(file.rawFile);
  }

  protected readXlsFileData(data) {
    try {
      return XLSX.read(data, { type: 'binary', cellDates: true });
    } catch (ex) {
      throw ex;
    }
  }

  protected process_wb(wb) {
    if (wb) {
      const workbook = wb;
      const sheetNameAlias = {};
      if (workbook && Array.isArray(workbook.SheetNames)) {
        workbook.SheetNames.forEach(function(sheetName) {
          if (new RegExp('_property', 'i').test(sheetName)) {
            sheetNameAlias[sheetName] = '_property';
          } else if (new RegExp('_financial', 'i').test(sheetName)) {
            sheetNameAlias[sheetName] = '_financial';
          } else {
            sheetNameAlias[sheetName] = sheetName.toLowerCase();
          }
        });
      }
      this.workbook = workbook;
      this.sheetNameAlias = sheetNameAlias;
    }

    if (this.isLoanFile === true) {
      this.submit();
    }
  }

  protected handleSheetNameChanged (oldsheetName: string, newSheetName:  string) {
    const self = this;
    if (newSheetName) {
      if (this.workbook) {
        if (this.workbook.SheetNames.findIndex(item => item === newSheetName) > -1) {
          this.toastr.error(`${newSheetName} already exists. Please choose another name`);
          self.sheetNameAlias[oldsheetName] = oldsheetName;
        }
      }
    }
    return false;
  }

}
