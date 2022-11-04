import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    ViewChild,
} from '@angular/core'
import * as PIXI from 'pixi.js'
import { PlaceEntity } from './entities/placeEntity'
import { v4 as uuidv4 } from 'uuid'
import { Global } from './../globals'
import { ArcReference } from './entities/arcReference'
import { ChangeDetectorRef } from '@angular/core'
import { XMLService } from '../services/xml.service'
import { NodeEntity } from './entities/nodeEntity'
import { TransitionEntity } from './entities/transitionEntity'

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css'],
})
export class DesignerComponent implements AfterViewInit {
    public arcBtnIsVisible = false
    public createArcInProgress = false
    public arcSourceNode: NodeEntity

    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private placeReferenceList: NodeEntity[] = []

    constructor(
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
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
            if (designerData) this.loadDataFromLocal(designerData)
            else this.xmlService.createNewXMLDocument()
        })
    }

    loadDataFromLocal(designerData: string) {
        console.log('Restoring data from local storage')

        Global.xmlDoc = new DOMParser().parseFromString(
            designerData,
            'text/xml'
        )

        // GENERATE PLACES
        Array.from(this.xmlService.getAllPlaces()).forEach((place) => {
            this.placeReferenceList.push(
                new PlaceEntity(
                    place.getAttribute('id') as string,
                    false,
                    Number(
                        place
                            .getElementsByTagName('graphics')[0]
                            .getElementsByTagName('position')[0]
                            .getAttribute('x')
                    ),
                    Number(
                        place
                            .getElementsByTagName('graphics')[0]
                            .getElementsByTagName('position')[0]
                            .getAttribute('y')
                    ),
                    String(
                        place
                            .getElementsByTagName('name')[0]
                            .getElementsByTagName('text')[0].textContent
                    ),
                    false,
                    this,
                    this.xmlService
                )
            )
        })

        // GENERATE Transitions
        Array.from(this.xmlService.getAllTransitions()).forEach(
            (transition) => {
                this.placeReferenceList.push(
                    new TransitionEntity(
                        transition.getAttribute('id') as string,
                        false,
                        Number(
                            transition
                                .getElementsByTagName('graphics')[0]
                                .getElementsByTagName('position')[0]
                                .getAttribute('x')
                        ),
                        Number(
                            transition
                                .getElementsByTagName('graphics')[0]
                                .getElementsByTagName('position')[0]
                                .getAttribute('y')
                        ),
                        String(
                            transition
                                .getElementsByTagName('name')[0]
                                .getElementsByTagName('text')[0].textContent
                        ),
                        false,
                        this,
                        this.xmlService
                    )
                )
            }
        )

        // GENERATE ARCS
        Array.from(this.xmlService.getAllArcs()).forEach((arc) => {
            this.addArc(
                String(arc.getAttribute('id')),
                String(arc.getAttribute('source')),
                String(arc.getAttribute('target')),
                String(
                    arc
                        .getElementsByTagName('inscription')[0]
                        .getElementsByTagName('text')[0].textContent
                ),
                false
            )
        })
    }

    addPlace() {
        this.placeReferenceList.push(
            new PlaceEntity(
                uuidv4(),
                false,
                30,
                30,
                'Test',
                true,
                this,
                this.xmlService
            )
        )
    }

    addTransition() {
        this.placeReferenceList.push(
            new TransitionEntity(
                uuidv4(),
                false,
                30,
                30,
                'Test',
                true,
                this,
                this.xmlService
            )
        )
    }

    addArc(
        id: string,
        sourceId: string,
        targetId: string,
        textValue: string,
        saveInXml: boolean
    ) {
        let tmpArc
        const sourceRef = this.placeReferenceList.find(
            (el) => el.id == sourceId
        )
        if (sourceRef) {
            tmpArc = new ArcReference(
                id,
                sourceId,
                targetId,
                textValue,
                sourceRef.sprite,
                saveInXml,
                this.xmlService
            )
            sourceRef.arcReferenceList.push(tmpArc)
        }

        const targetRef = this.placeReferenceList.find(
            (el) => el.id == targetId
        )
        if (targetRef && tmpArc) targetRef.arcReferenceList.push(tmpArc)

        this.createArcInProgress = false
        this.deactivateCreateArcBtn()
    }

    deleteLocalStorage() {
        if (
            confirm('Are you sure to delete all nodes and start from scratch?')
        ) {
            localStorage.clear()
            if (Global.app) Global.app.destroy()
            this.ngAfterViewInit()
        }
    }

    public activateCreateArcBtn(sourceNode: NodeEntity) {
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff // reset old node tint

        this.arcSourceNode = sourceNode
        this.arcSourceNode.sprite.tint = 0x71beeb
        this.arcBtnIsVisible = true
        this.cdr.detectChanges()
    }

    public deactivateCreateArcBtn() {
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff // reset node tint

        this.arcBtnIsVisible = false
        this.cdr.detectChanges()
    }

    startCreateArc() {
        this.createArcInProgress = true
        this.cdr.detectChanges()
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(
            this.div.nativeElement.offsetWidth,
            this.div.nativeElement.offsetHeight
        )
    }

    saveNetToXML() {
        localStorage.setItem(
            'designerData',
            new XMLSerializer().serializeToString(Global.xmlDoc.documentElement)
        )
        alert('Saved net to XML in local storage')
    }

    ngOnDestroy(): void {
        if (Global.app) Global.app.destroy()
        localStorage.setItem(
            'designerData',
            new XMLSerializer().serializeToString(Global.xmlDoc.documentElement)
        )
    }
}
