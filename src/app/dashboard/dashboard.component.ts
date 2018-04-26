import {Component, OnInit, Injectable, OnDestroy} from '@angular/core';
import { FileUploader, FileItem, FileLikeObject } from 'ng2-file-upload';
import { ModalService } from '../services/modal.service';
import { AppConstant } from '../app-constant';
import * as _ from 'lodash';
import * as async from 'async';
import * as XLSX from 'xlsx';
import {HttpClient, HttpHeaders, HttpRequest, HttpResponse, HttpEventType, } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import {InvestmentTreeHelperService} from '../services/investment-tree-helper.service';
import * as FileSaver from 'file-saver';
import * as $ from 'jquery';
import 'jquery-ui';
import 'jstree';
import {ToastrService} from 'ngx-toastr';
import * as moment from 'moment';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
@Injectable()
export class DashboardComponent implements OnInit, OnDestroy {
  public serviceFileuploader: FileUploader = new FileUploader({ url: AppConstant.FILE_UPLOAD_URI_LOCAL });
  public loanFileuploader: FileUploader = new FileUploader({ url: AppConstant.FILE_UPLOAD_URI_LOCAL });
  public lperFileuploader: FileUploader = new FileUploader({ url: AppConstant.FILE_UPLOAD_URI_LOCAL });
  private modalService: ModalService;
  isLoanFileOver: boolean;
  isLperFileOver: boolean;
  isServiceFileOver: boolean;
  availableServiceTabs: any;
  serviceFilePropertyMap = {};
  investments: [Object];
  totalNumberOfInvestment: number;
  totalNumberOfAsset: number;
  errorMsgLog: string;
  showErrorMsgLog: boolean;
  submittingFiles: boolean;
  treeJsonData: any;

  constructor(modalService: ModalService, protected httpClient: HttpClient, protected investmentTreeHelperService: InvestmentTreeHelperService, private toastr: ToastrService) {
    this.modalService = modalService;
    console.log('DashboardComponent', this);
    this.availableServiceTabs = this.buildAvailableServiceTabs();
  }

  ngOnInit() {}

  buildAvailableServiceTabs() {
    return _.cloneDeep(AppConstant.SHEET_NAME_OPTIONS).reduce(function(
      memo,
      current
    ) {
      memo.push({
        name: current,
        isAvailable: false
      });
      return memo;
    },
    []);
  }

  ngOnChange(changedObj: any) {}


  uploadFiles () {



    const self = this;
    $.jstree.destroy();
    self.submittingFiles = true;
    self.totalNumberOfInvestment = null;
    self.totalNumberOfAsset = null;
    const formData = new FormData();

    this.loanFileuploader.queue.map(function (item) {
      formData.append('loanFile', item.file.rawFile['rawFile'], item.file.name);
    });

    this.serviceFileuploader.queue.map(function (item) {
      formData.append('serviceFile', item.file.rawFile['rawFile'], item.file.name);
    });

    this.lperFileuploader.queue.map(function (item) {
      formData.append('lperFile', item.file.rawFile['rawFile'], item.file.name);
    });

    const req = new HttpRequest(
      'POST',
      AppConstant.FILE_UPLOAD_URI_LOCAL,
      formData,
      { reportProgress: true }
    );


    this.httpClient.request(req).subscribe(res => {
      console.log('res found  ', res);
      if (res.type === HttpEventType.UploadProgress) {
        const percentage = Math.round(100 * res.loaded / res.total);

        console.log(`File is ${percentage}% uploaded`);
      } else if (res instanceof HttpResponse) {

        self.submittingFiles = false;
        self.toastr.success('Files Data has been parsed successfully');
        const body = res.body;
        if (body['Investments']) {

          self.investments = body['Investments'];
          self.totalNumberOfInvestment = _.size(self.investments);
          self.totalNumberOfAsset = 0;

          self.treeJsonData = self.investmentTreeHelperService.buildTree(self.investments);
          $('#investmentTreeView').jstree({
            core: {
              data: {
                text: 'Investments',
                state: { opened: false },
                children: self.treeJsonData
              }
            }
          });

          const _totalNumberOfAsset = self.investments.reduce(function (memo: number, current: any): any {
            if (current && Array.isArray(current.properties)) {
              memo += _.size(current.properties);
            }
            return memo;
          }, 0);

          self.totalNumberOfAsset = _totalNumberOfAsset;
        }

        const errors = res.body['errors'];

        if (errors && errors.length > 0) {
          const inputArr = [];
          const errorGroupByType = _.groupBy(errors, 'type');
          _.sortBy(Object.keys(errorGroupByType)).forEach(function (keyName) {
            if (inputArr.length > 0) {
              inputArr.push(` `);
            }
            inputArr.push(` Error type ${keyName} `);
            inputArr.push(` `);
            errorGroupByType[keyName].forEach(function (log) {
              inputArr.push(log.message);
            });
          });

          if (inputArr.length > 0) {
            self.errorMsgLog = inputArr.join('\n');
          }

        }
         // const [Investments, errors ] =   res.body ;

        // let  { Investments, errors } = { ... res.body };

         // declare type res.body.Investment;


        console.log(`File is completely uploaded`);
      }
    });
  }

  adjustServiceFiles() {
    const self = this;
    const availableServiceTabs = this.buildAvailableServiceTabs();
    this.processServiceFiles();
  }

  processServiceFiles(): void {
    const self = this;
    const files = this.serviceFileuploader.queue.map(item => item);
    async.eachSeries(
      files,
      async function(item, next) {
        const file = item.file;
        if (/\.txt$/i.test(file.name) || /\.csv/i.test(file.name)) {
          try {
            const result = await self.modalService.showModal(
              'xlsxImportEditor',
              { file: file, isLoanFile: false }
            );
            if (result && result.file) {
              self.updateProcessedServiceFile(item, result);
            }
            next(null, file);
          } catch (err) {
            console.log('error ', err);
            next(null, file);
          }
        } else if (
          !self.serviceFilePropertyMap[file.name] ||
          (self.serviceFilePropertyMap[file.name] &&
            !self.serviceFilePropertyMap[file.name]
              .isSheetNameCheckingProcessed)
        ) {
          try {
            const result = await self.modalService.showModal(
              'sheetNameEditor',
              { file: file }
            );
            if (result && result.file) {
              self.updateProcessedServiceFile(item, result);
            }
            next(null, file);
          } catch (err) {
            console.log('error ', err);
            next(null, file);
          }
        } else {
          next(null);
        }
      },
      function() {}
    );
  }

  private updateProcessedServiceFile(item, result) {

    const self = this;
    const sheetNameMap = {};
    self.serviceFileuploader.removeFromQueue(item);
    self.serviceFileuploader.addToQueue([result.file]);
    if (!self.serviceFilePropertyMap[result.file.name]) {
      self.serviceFilePropertyMap[result.file.name] = {};
    }
    self.serviceFilePropertyMap[
      result.file.name
    ].isSheetNameCheckingProcessed = true;
    const reader = new FileReader();
    reader.onload = function(e: any) {
      const data = e.target.result;
      let workbook;
      try {
        workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        if (workbook && Array.isArray(workbook.SheetNames)) {
          workbook.SheetNames.forEach(function(sheetName) {
            sheetNameMap[sheetName.toLowerCase()] = true;
          });
          const sheetNameMapKeys = Object.keys(sheetNameMap);
          self.availableServiceTabs = self.availableServiceTabs.map(function(
            serviceTab
          ) {
            const isAvailable = sheetNameMapKeys.some(function(keyNameItem) {
              return new RegExp(serviceTab.name + '$', 'i').test(keyNameItem);
            });
            if (isAvailable === true) {
              serviceTab.isAvailable = isAvailable;
            }
            return serviceTab;
          });
          // console.log("self.availableServiceTabs", self.availableServiceTabs);
        }
      } catch (ex) {
        const message =
          'Failed to read the uploaded file. Please check if it contains unsupported characters or formats.';
        console.log(message);
      }
    };
    reader.readAsBinaryString(result.file.rawFile);
  }



  downloadJson () {

    const data = this.investments;
    const firstInvestment = _.head(this.investments);

    // InvestmentJsonFormatHelper.formatDownloadableJson($ctrl.investments);
    const file = new Blob([JSON.stringify(data, null, 4)], {
      type: 'application/json'
    });


    const _propertyFile = this.serviceFileuploader.queue.find(item => /_property/i.test(item.file.name));
    let downloadableFileName;

    if (firstInvestment  &&  firstInvestment.transactionId) {
      downloadableFileName = firstInvestment.transactionId + '_' + moment().format('MMDDhmmsss') + '.json';

    } else  if (_propertyFile && _propertyFile.file.name) {
      downloadableFileName = _propertyFile.file.name.substring(0, _propertyFile.file.name.lastIndexOf('.')) + '_' +  moment().format('MMDDhmmss') + '.json';
    }

    FileSaver.saveAs(file, downloadableFileName);

  }

  ngOnDestroy (){

  }
  adjustLoanFiles() {

    const self = this;
    const files = this.loanFileuploader.queue.map(item => item);
    async.eachSeries(
      files,
      async function(item, next) {
        const file = item.file;
        if (/\.txt$/i.test(file.name) || /\.csv/i.test(file.name)) {
          try {
            const result = await self.modalService.showModal(
              'xlsxImportEditor',
              { file: file, isLoanFile: true }
            );
            if (result && result.file) {
              self.loanFileuploader.removeFromQueue(item);
              self.loanFileuploader.addToQueue([result.file]);
            }
            next(null, file);
          } catch (err) {
            console.log('error ', err);
            next(null, file);
          }
        } else {
          next(null);
        }
      },
      function() {}
    );
  }

  adjustLperFiles() {
    const self = this;
    const files = this.lperFileuploader.queue.map(item => item);
    async.eachSeries(
      files,
      async function(item, next) {
        const file = item.file;
        if (/\.txt$/i.test(file.name) || /\.csv/i.test(file.name)) {
          try {
            const result = await self.modalService.showModal(
              'xlsxImportEditor',
              { file: file, isLoanFile: true }
            );
            if (result && result.file) {
              self.lperFileuploader.removeFromQueue(item);
              self.lperFileuploader.addToQueue([result.file]);
            }
            next(null, file);
          } catch (err) {
            console.log('error ', err);
            next(null, file);
          }
        } else {
          next(null);
        }
      },
      function() {}
    );
  }

  onLoanFileSelect() {
    this.adjustLoanFiles();
  }

  onServiceFileSelect() {
    this.adjustServiceFiles();
  }

  onLperFileSelect() {
    this.adjustLperFiles();
  }
}
