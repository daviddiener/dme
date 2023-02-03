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
import { NodeEntity } from '../entities/nodeEntity'
import { Relation } from '../entities/relation'
import { PlaceEntity } from '../entities/placeEntity'
import { TransitionEntity } from '../entities/transitionEntity'
import { ClassEntity } from '../entities/classEntity'
import { getUUID } from '../services/helper.service'

@Component({
    selector: 'app-model-extractor',
    templateUrl: './model-extractor.component.html',
    styleUrls: ['./model-extractor.component.css'],
})
export class ModelExtractorComponent implements AfterViewInit {
    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private classReferenceList: NodeEntity[] = []

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
                Global.xmlDoc = new DOMParser().parseFromString(
                    designerData,
                    'text/xml'
                )
            
                this.generateOwners()

                this.generateClassesFromMarkings()

                this.generateCardinalities()

            } else alert('No valid xml string found')
        })
    }


    generateCardinalities() {
        Array.from(this.xmlService.getAllTransitions()).forEach(element => {
            const id = element.getAttribute('id')
            const predecessor = this.xmlService.getAllArcsWithTarget(id)[0]
            const successor = this.xmlService.getAllArcsWithSource(id)[0]

            // check for null before extracting the names of the 2 classes we want to connect with a relation
            if(successor && predecessor) {
                const predecessorName = this.xmlService.getNodeMarkingDataObjectName(predecessor.getAttribute('source'))
                const successorName = this.xmlService.getNodeMarkingDataObjectName(successor.getAttribute('target'))

                // if the names of the classes are the same we dont want to generate a realtion
                if(predecessorName != successorName){
                    this.addRelation(
                        predecessorName,
                        successorName,
                        String(predecessor.getElementsByTagName('cardinality')[0].textContent),
                        String(successor.getElementsByTagName('cardinality')[0].textContent)
                    )
                }
            }
            
        });
    }

    generateClassesFromMarkings() {
        let xPosition = 100
        let yPosition = 250

        let objectsWithIncomingArcs: (string | null)[] = []
        Array.from(this.xmlService.getAllArcs()).forEach(element => {
            objectsWithIncomingArcs.push(element.getAttribute('target'))
        });

        
        Array.from(this.xmlService.getAllPlaces()).forEach((place) => {
            let marking = place.getElementsByTagName('marking')
            // check if the place has a marking
            if(marking.length > 0) {
                // check if a class with the same marking name has already been created
                if(this.classReferenceList.find((el) => el.textValue == marking[0].getAttribute('name')) == undefined){
                     // set sprite tint to red if the class is an existing (external) object
                    let color:number = 0xFF0000
                    if(objectsWithIncomingArcs.some(x => x == String(place.getAttribute('id')))){
                        color = 0xFFFFFF
                    }

                    // create the class
                    this.classReferenceList.push(
                        new ClassEntity(
                            getUUID(),
                            xPosition,
                            yPosition,
                            String(marking[0].getAttribute('name')),
                            undefined,
                            this.xmlService,
                            color
                        )
                    )

                    xPosition += 150
                    yPosition += 100
                }

               
            }
        })

    }

    generateOwners() {
        let xPosition = 100
        this.xmlService.getDistinctOwners().forEach(element => {
            this.classReferenceList.push(
                new ClassEntity(
                    getUUID(),
                    xPosition,
                    50,
                    element,
                    undefined,
                    this.xmlService,
                    0xFFFFFF
                )
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

    addRelation(
        sourceName: string,
        targetName: string,
        textValueC1: string,
        textValueC2: string,
    ) {
        const sourceRef = this.classReferenceList.find((el) => el.textValue == sourceName)
        const targetRef = this.classReferenceList.find((el) => el.textValue == targetName)

        let tmpRelation
        if(sourceRef && targetRef){
            tmpRelation = new Relation(
                sourceRef,
                targetRef,
                textValueC1,
                textValueC2,
                sourceRef.sprite
            )
            
            sourceRef.relationList.push(tmpRelation)
            targetRef.relationList.push(tmpRelation)
        }
    }

}