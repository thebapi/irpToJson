import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'jquery-ui';
import 'bootstrap';


/* import { $ }  from 'jquery';
import { * } from 'jquery-ui';
window.jQuery  =  $;
window.jquery = $;

import { Buffer } from 'buffer/Buffer';
import { XLSX }  from 'xlsx';

import {jstree } from 'jstree';
 */
if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
