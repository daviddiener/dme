import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
    ngOnInit(): void {}

    constructor(
        private router: Router,
        private httpClient: HttpClient
        ) { }

    public openPNMLModel(fileName : string){

        this.httpClient.get('assets/'+fileName, {responseType: 'text'})
        .subscribe(data => {
            localStorage.setItem('designerData', data)
            this.router.navigateByUrl('/designer')
        });

    }
}
