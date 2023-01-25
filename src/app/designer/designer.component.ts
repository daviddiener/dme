import {
    AfterViewInit,
    Component,
    ElementRef,
    ViewChild,
} from '@angular/core'
import * as PIXI from 'pixi.js'
import { PlaceEntity } from '../entities/placeEntity'
import { v4 as uuidv4 } from 'uuid'
import { Global } from './../globals'
import { ArcReference } from '../entities/arcReference'
import { XMLService } from '../services/xml.service'
import { NodeEntity } from '../entities/nodeEntity'
import { TransitionEntity } from '../entities/transitionEntity'
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css'],
})
export class DesignerComponent implements AfterViewInit {
    public arcBtnIsVisible = false
    public createArcInProgress = false
    public arcSourceNode: NodeEntity

    name = 'not set';
    owner = 'not set';
    markingName = 'not set';
    data: { name: string; type: string }[] = []

    types = ["xs:integer", "xs:Boolean", "xs:string", "xs:date"];

    column_schema = [
    {
        key: "name",
        type: "text",
        label: "Name"
    },
    {
        key: "type",
        type: "type",
        label: "Type"
    },
    {
        key: "isEdit",
        type: "isEdit",
        label: ""
      }
    ]

    displayedColumns: string[] = this.column_schema.map(col => col.key);
      

    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private nodeReferenceList: NodeEntity[] = []
    private promiseList: Promise<void>[] = []

    constructor(
        private xmlService: XMLService,
        private clipboard: Clipboard
    ) {}

    ngAfterViewInit(): void {
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
    }

    loadDataFromLocal(designerData: string) {
        console.log('Restoring data from local storage')

        Global.xmlDoc = new DOMParser().parseFromString(
            designerData,
            'text/xml'
        )

        // GENERATE PLACES
        Array.from(this.xmlService.getAllPlaces()).forEach((place) => {
            this.nodeReferenceList.push(
                new PlaceEntity(
                    place.getAttribute('id') as string,
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
                this.nodeReferenceList.push(
                    new TransitionEntity(
                        transition.getAttribute('id') as string,
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

        // Collect promises
        this.nodeReferenceList.forEach((node) => {
            this.promiseList.push(node.promise)
        })

        // GENERATE ARCS
        /* 
        Wait for the promises of the parent sprites to update the texture - necessary, 
        otherwise heigt and width will be 0 and the anchorpoint for the arcs will be wrong 
        */
        Promise.all(this.promiseList).then(() => {
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
                    String(arc
                        .getElementsByTagName('cardinality')[0]
                        .getElementsByTagName('text')[0].textContent),
                    false
                )
            })
        })
    }

    addPlace() {
        this.nodeReferenceList.push(
            new PlaceEntity(
                uuidv4(),
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
        this.nodeReferenceList.push(
            new TransitionEntity(
                uuidv4(),
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
        cardinality: string,
        saveInXml: boolean
    ) {
        let tmpArc
        const sourceRef = this.nodeReferenceList.find((el) => el.id == sourceId)
        if (sourceRef) {
            tmpArc = new ArcReference(
                id,
                sourceId,
                targetId,
                textValue,
                cardinality,
                sourceRef.sprite,
                saveInXml,
                this.xmlService
            )
            sourceRef.arcList.push(tmpArc)
        }

        const targetRef = this.nodeReferenceList.find((el) => el.id == targetId)
        if (targetRef && tmpArc) targetRef.arcList.push(tmpArc)

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

        this.name = this.xmlService.getNodeName(this.arcSourceNode.id)
        this.owner = this.xmlService.getNodeOwner(this.arcSourceNode.id)
        this.data = this.xmlService.getNodeMarking(this.arcSourceNode.id)
        this.markingName = this.xmlService.getNodeMarkingDataObjectName(this.arcSourceNode.id)
    }

    public deactivateCreateArcBtn() {
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff // reset node tint

        this.arcBtnIsVisible = false
    }

    startCreateArc() {
        this.createArcInProgress = true
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(
            this.div.nativeElement.offsetWidth,
            this.div.nativeElement.offsetHeight
        )
    }

    updateName(){
        this.arcSourceNode.changeName(this.name)
    }

    updateRole(){
        this.xmlService.updateNodeOwner(this.arcSourceNode.id, this.owner)
    }

    addRow() {
        const newRow = {"name": "", "type": "", isEdit: true}
        this.data = [...this.data, newRow];
    }

    addRowDone(element: any) {
        element.isEdit = !element.isEdit
        this.updateNodeMarking()
    }

    updateNodeMarking(){
        this.xmlService.updateNodeMarking(this.arcSourceNode.id, this.markingName, this.data)
    }

    removeRow(name: string) {
        this.data = this.data.filter((u) => u.name !== name);
        this.updateNodeMarking()
    }

    saveNetToXML() {
        localStorage.setItem(
            'designerData',
            new XMLSerializer().serializeToString(Global.xmlDoc.documentElement)
        )
        alert('Saved net to XML in local storage')
    }

    saveNetToClipboard() {
        this.clipboard.copy(new XMLSerializer().serializeToString(Global.xmlDoc.documentElement));

        alert('Saved net to clipboard')
    }

    readNetFromClipboard() {
        navigator.clipboard.readText()
            .then(text => {
                this.nodeReferenceList = []
                localStorage.setItem('designerData', text)
                if (Global.app) Global.app.destroy()
                this.ngAfterViewInit()
            })
            .catch(err => {
                alert('Failed to read clipboard contents ' + err);
            });
    }
    

    ngOnDestroy(): void {
        if (Global.app) Global.app.destroy()

        localStorage.setItem(
            'designerData',
            new XMLSerializer().serializeToString(Global.xmlDoc.documentElement)
        )
    }
}
