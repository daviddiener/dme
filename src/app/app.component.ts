import { Component } from '@angular/core';

const appVersion = require('../../package.json').version;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public version: string = appVersion;
  public isCollapsed = true;

}
