import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { PlaceEntity } from '../entities/placeEntity'
import { getUUID, initializePixiApplication } from '../services/helper.service'
import { Global } from './../globals'
import { ArcReference } from '../entities/arcReference'
import { XMLService } from '../services/xml.service'
import { NodeType, NodeEntity } from '../entities/nodeEntity'
import { TransitionEntity } from '../entities/transitionEntity'
import { Clipboard } from '@angular/cdk/clipboard'
import { MatSnackBar } from '@angular/material/snack-bar'
import { XMLNodeService } from '../services/xml.node.service'
import { XMLPlaceService } from '../services/xml.place.service'
import { XMLTransitionService } from '../services/xml.transition.service'
import { XMLArcService } from '../services/xml.arc.service'

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css'],
})
export class DesignerComponent implements AfterViewInit {
    public placeSelected = false
    public transitionSelected = false
    public createArcInProgress = false
    public arcSourceNode: NodeEntity

    public name = '-'
    public owner = '-'
    public tokenSchemaName = '-'
    public data: { name: string; type: string }[] = []

    types = ['xs:integer', 'xs:Boolean', 'xs:string', 'xs:date']

    column_schema = [
        {
            key: 'name',
            type: 'text',
            label: 'Name',
        },
        {
            key: 'type',
            type: 'type',
            label: 'Type',
        },
        {
            key: 'isEdit',
            type: 'isEdit',
            label: '',
        },
    ]

    displayedColumns: string[] = this.column_schema.map((col) => col.key)

    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private nodeReferenceList: NodeEntity[] = []
    private promiseList: Promise<void>[] = []

    constructor(
        private _snackBar: MatSnackBar,
        private xmlService: XMLService,
        private xmlNodeService: XMLNodeService,
        private xmlPlaceService: XMLPlaceService,
        private xmlTransitionService: XMLTransitionService,
        private xmlArcService: XMLArcService,
        private clipboard: Clipboard
    ) {}

    ngAfterViewInit(): void {
        initializePixiApplication()

        this.div.nativeElement.innerHTML = ''
        this.div.nativeElement.appendChild(Global.app.view)
        this.adjustCanvasSize()

        // load XML file
        const designerData = localStorage.getItem('designerData')
        if (designerData) this.loadDataFromLocal(designerData)
        else this.xmlService.createNewXMLDocument()
    }

    loadDataFromLocal(designerData: string) {
        Global.xmlDoc = new DOMParser().parseFromString(designerData, 'text/xml')

        // GENERATE PLACES
        Array.from(this.xmlPlaceService.getAllPlaces()).forEach((place) => {
            this.nodeReferenceList.push(
                new PlaceEntity(
                    place.getAttribute('id') as string,
                    Number(
                        place.getElementsByTagName('graphics')[0].getElementsByTagName('position')[0].getAttribute('x')
                    ),
                    Number(
                        place.getElementsByTagName('graphics')[0].getElementsByTagName('position')[0].getAttribute('y')
                    ),
                    String(place.getElementsByTagName('name')[0].getElementsByTagName('text')[0].textContent),
                    false,
                    this,
                    this.xmlNodeService
                )
            )
        })

        // GENERATE Transitions
        Array.from(this.xmlTransitionService.getAllTransitions()).forEach((transition) => {
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
                    String(transition.getElementsByTagName('name')[0].getElementsByTagName('text')[0].textContent),
                    false,
                    this,
                    this.xmlNodeService
                )
            )
        })

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
            Array.from(this.xmlArcService.getAllArcs()).forEach((arc) => {
                this.addArc(
                    String(arc.getAttribute('id')),
                    String(arc.getAttribute('source')),
                    String(arc.getAttribute('target')),
                    String(arc.getElementsByTagName('inscription')[0]?.getElementsByTagName('text')[0].textContent),
                    String(arc.getElementsByTagName('hlinscription')[0]?.textContent),
                    false
                )
            })
        })
    }

    addPlace() {
        this.nodeReferenceList.push(new PlaceEntity(getUUID(), 30, 30, 'Test', true, this, this.xmlNodeService))
    }

    addTransition() {
        this.nodeReferenceList.push(new TransitionEntity(getUUID(), 30, 30, 'Test', true, this, this.xmlNodeService))
    }

    addArc(id: string, sourceId: string, targetId: string, textValue: string, cardinality: string, saveInXml: boolean) {
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
                this.xmlArcService,
                this.xmlNodeService
            )
            sourceRef.arcList.push(tmpArc)
        }

        const targetRef = this.nodeReferenceList.find((el) => el.id == targetId)
        if (targetRef && tmpArc) targetRef.arcList.push(tmpArc)

        this.createArcInProgress = false
        this.deactivatePropertiesPanel()
    }

    deleteLocalStorage() {
        if (confirm('Are you sure to delete all nodes and start from scratch?')) {
            localStorage.clear()
            if (Global.app) Global.app.destroy()
            this.ngAfterViewInit()
            this.openSnackBar('Deleted all nodes')
        }
    }

    public activatePropertiesPanel(sourceNode: NodeEntity) {
        // reset panel if previously selected
        this.placeSelected = false
        this.transitionSelected = false
        this.name = '-'
        this.owner = '-'
        this.tokenSchemaName = '-'
        this.data = []

        // reset old node tint
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff
        this.arcSourceNode = sourceNode
        this.arcSourceNode.sprite.tint = 0x71beeb

        // get node data
        this.name = this.xmlNodeService.getNodeNameById(this.arcSourceNode.id)

        if (sourceNode.nodeType == NodeType.transition) {
            this.transitionSelected = true
            this.owner = this.xmlTransitionService.getTransitionOwner(this.arcSourceNode.id)
        }

        if (sourceNode.nodeType == NodeType.place) {
            this.placeSelected = true
            this.data = this.xmlPlaceService.getPlaceTokenSchema(this.arcSourceNode.id)
            this.tokenSchemaName = this.xmlPlaceService.getPlaceTokenSchemaName(this.arcSourceNode.id)
        }
    }

    public deactivatePropertiesPanel() {
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff // reset node tint

        this.placeSelected = false
        this.transitionSelected = false
    }

    startCreateArc() {
        this.createArcInProgress = true
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(this.div.nativeElement.offsetWidth, this.div.nativeElement.offsetHeight)
    }

    updateName() {
        this.arcSourceNode.changeName(this.name)
    }

    updateRole() {
        this.xmlTransitionService.updateTransitionRole(this.arcSourceNode.id, this.owner)
    }

    addRow() {
        const newRow = { name: '', type: '', isEdit: true }
        this.data = [...this.data, newRow]
    }

    // eslint-disable-next-line
    addRowDone(element: any) {
        element.isEdit = !element.isEdit
        this.updatePlaceTokenSchema()
    }

    updatePlaceTokenSchema() {
        this.xmlPlaceService.updatePlaceTokenSchema(this.arcSourceNode.id, this.tokenSchemaName, this.data)
    }

    removeRow(name: string) {
        this.data = this.data.filter((u) => u.name !== name)
        this.updatePlaceTokenSchema()
    }

    saveNetToXML() {
        localStorage.setItem('designerData', new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
        this.openSnackBar('Saved net to XML in local storage')
    }

    saveNetToClipboard() {
        this.clipboard.copy(new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))

        this.openSnackBar('Saved net to clipboard')
    }

    readNetFromClipboard() {
        const backup = localStorage.getItem('designerData')

        navigator.clipboard
            .readText()
            .then((text) => {
                localStorage.setItem('designerData', text)
                this.nodeReferenceList = []
                if (Global.app) Global.app.destroy()
                this.ngAfterViewInit()
                this.openSnackBar('Successfully imported clipboard content')
            })
            .catch((err) => {
                if (backup) {
                    localStorage.setItem('designerData', backup)
                    this.nodeReferenceList = []
                    if (Global.app) Global.app.destroy()
                    this.ngAfterViewInit()
                }

                this.openSnackBar('Failed to parse clipboard content ' + err)
            })
    }

    openSnackBar(message: string) {
        this._snackBar.open(message, '', { duration: 2000 })
    }

    ngOnDestroy(): void {
        if (Global.app) Global.app.destroy()

        localStorage.setItem('designerData', new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
    }
}
