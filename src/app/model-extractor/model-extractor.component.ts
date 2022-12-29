import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    ViewChild,
} from '@angular/core'
import * as PIXI from 'pixi.js'
import { Global } from './../globals'
import { ChangeDetectorRef } from '@angular/core'
import { XMLService } from '../services/xml.service'

@Component({
    selector: 'app-model-extractor',
    templateUrl: './model-extractor.component.html',
    styleUrls: ['./model-extractor.component.css'],
})
export class ModelExtractorComponent implements AfterViewInit {
    @ViewChild('pixiCanvasContainer') private div: ElementRef

    constructor(
        private ngZone: NgZone,
        private xmlService: XMLService
    ) {}

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
            // init application
            Global.app = new PIXI.Application({
                backgroundColor: 0x0d6efd,
            })

            this.div.nativeElement.innerHTML = ''
            this.div.nativeElement.appendChild(Global.app.view)
            this.adjustCanvasSize()

            // load XML file
            const designerData = localStorage.getItem('designerData')
            if (designerData) {
                console.log('Grabbing data from local storage')
                Global.xmlDoc = new DOMParser().parseFromString(
                    designerData,
                    'text/xml'
                )

                console.log(this.xmlService.getAllOwners())
            

                // for (let i = 0; i < this.xmlService.getAllPlaces().length; i++) {
                //     console.log(this.xmlService.getAllPlaces()[i]);
                // }

            } else alert('No valid xml string found')
        })
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(
            this.div.nativeElement.offsetWidth,
            this.div.nativeElement.offsetHeight
        )
    }
}
