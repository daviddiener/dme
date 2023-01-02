import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    ViewChild,
} from '@angular/core'
import * as PIXI from 'pixi.js'
import { v4 as uuidv4 } from 'uuid'
import { Global } from './../globals'
import { ChangeDetectorRef } from '@angular/core'
import { XMLService } from '../services/xml.service'
import { NodeEntity } from '../entities/nodeEntity'
import { PlaceEntity } from '../entities/placeEntity'
import { TransitionEntity } from '../entities/transitionEntity'
import { ClassEntity } from '../entities/classEntity'

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
            
                this.generateOwners()

                this.generateActions()

            } else alert('No valid xml string found')
        })
    }

    generateActions() {
        let xPosition = 100

        let generatedObjectIds: (string | null)[] = []
        Array.from(this.xmlService.getAllArcs()).forEach(element => {
            generatedObjectIds.push(element.getAttribute('target'))
        });

        this.xmlService.getDistinctPlaces().forEach((place) => {

            // set sprite tint to red if the class is an existing (external) object
            let color:number = 0xFF0000
            if(generatedObjectIds.some(x => x === this.xmlService.getNodeIdByName(place))){
                color = 0xFFFFFF
            }

            new ClassEntity(
                uuidv4(),
                xPosition,
                250,
                String(place),
                false,
                undefined,
                this.xmlService,
                color
            )
            xPosition += 150
        })

    }

    generateOwners() {
        let xPosition = 100
        this.xmlService.getDistinctOwners().forEach(element => {
            new ClassEntity(
                uuidv4(),
                xPosition,
                50,
                element,
                false,
                undefined,
                this.xmlService,
                0xFFFFFF
            )
    
            xPosition += 150
        })
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(
            this.div.nativeElement.offsetWidth,
            this.div.nativeElement.offsetHeight
        )
    }
}