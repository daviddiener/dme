import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { Place } from '../entities/place'
import { getUUID, initializePixiApplication } from '../services/helper.service'
import { Global } from './../globals'
import { Arc } from '../entities/arc'
import { XMLService } from '../services/xml.service'
import { NodeType, Node } from '../entities/node'
import { Transition } from '../entities/transition'
import { Clipboard } from '@angular/cdk/clipboard'
import { MatSnackBar } from '@angular/material/snack-bar'
import { XMLNodeService } from '../services/xml.node.service'
import { XMLPlaceService } from '../services/xml.place.service'
import { XMLTransitionService } from '../services/xml.transition.service'
import { XMLArcService } from '../services/xml.arc.service'

const appVersion = require('../../../package.json').version

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css'],
})
export class DesignerComponent implements AfterViewInit {
    public placeSelected = false
    public transitionSelected = false
    public createArcInProgress = false
    public arcSourceNode: Node

    public name = ''
    public superClassSelected: string[]
    public role = ''
    public tokenSchemaName = ''
    public data: { name: string; type: string, isPrimaryKey: boolean }[] = []

    types = ['anyURI','base64Binary','boolean','date','dateTime','decimal','double','duration','float','hexBinary','gDay','gMonth','gMonthDay','gYear','gYearMonth','NOTATION','QName','string','time']
    superClasses: string[] = []

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
            key: 'isPrimaryKey',
            type: 'boolean',
            label: 'Primary Key',
        },
        {
            key: 'isEdit',
            type: 'isEdit',
            label: '',
        },
    ]

    displayedColumns: string[] = this.column_schema.map((col) => col.key)

    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private nodeReferenceList: Node[] = []
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

        if (designerData) {
            this.loadDataFromLocal(designerData)
            const netVersion = localStorage.getItem('netVersion')
            if (netVersion && appVersion != netVersion)
                this._snackBar.open(
                    'The saved net was created with version ' +
                        netVersion +
                        '. The net may be incompatible with the current version ' +
                        appVersion +
                        '.',
                    'Close'
                )
        } else this.xmlService.createNewXMLDocument()
    }

    loadDataFromLocal(designerData: string) {
        Global.xmlDoc = new DOMParser().parseFromString(designerData, 'text/xml')

        // GENERATE PLACES
        Array.from(this.xmlPlaceService.getAllPlaces()).forEach((place) => {
            const place_id = place.getAttribute('id') as string

            this.nodeReferenceList.push(
                new Place(
                    place_id,
                    Number(
                        place.querySelector("graphics > position")?.getAttribute('x')
                    ),
                    Number(
                        place.querySelector("graphics > position")?.getAttribute('y')
                    ),
                    String(place.getElementsByTagName('name')[0].getElementsByTagName('text')[0].textContent),
                    false,
                    this,
                    this.xmlNodeService,
                    this.xmlPlaceService.getPlaceTokenSchemaName(place_id),
                    this.xmlPlaceService.getPlaceTokenSchema(place_id),
                    this.xmlPlaceService.getPlaceSuperClassNameById(place_id)
                )
            )
        })

        // GENERATE Transitions
        Array.from(this.xmlTransitionService.getAllTransitions()).forEach((transition) => {            
            this.nodeReferenceList.push(
                new Transition(
                    transition.getAttribute('id') as string,
                    Number(
                        transition.querySelector("graphics > position")?.getAttribute('x')
                    ),
                    Number(
                        transition.querySelector("graphics > position")?.getAttribute('y')
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
                let cardinality = String(arc.getElementsByTagName('hlinscription')[0]?.textContent?.trim() ?? '*')
                if(!Boolean(cardinality.trim())) cardinality = '*'
                
                this.addArc(
                    String(arc.getAttribute('id')),
                    String(arc.getAttribute('source')),
                    String(arc.getAttribute('target')),
                    cardinality,
                    false
                )
            })
        })
    }

    addPlace() {
        this.nodeReferenceList.push(new Place(getUUID(), 30, 30, 'Test', true, this, this.xmlNodeService))
    }

    addTransition() {
        this.nodeReferenceList.push(new Transition(getUUID(), 30, 30, 'Test', true, this, this.xmlNodeService))
    }

    addArc(id: string, sourceId: string, targetId: string, cardinality: string, saveInXml: boolean) {
        let tmpArc
        const sourceRef = this.nodeReferenceList.find((el) => el.id == sourceId)
        if (sourceRef) {
            tmpArc = new Arc(
                id,
                sourceId,
                targetId,
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
            this._snackBar.open('Deleted all nodes', '', { duration: 2000 })
        }
    }

    public activatePropertiesPanel(sourceNode: Node) {
        // reset panel if previously selected
        this.placeSelected = false
        this.transitionSelected = false
        this.name = ''
        this.role = ''
        this.tokenSchemaName = ''
        this.superClassSelected = []
        this.data = []

        // reset old node tint
        if (this.arcSourceNode) this.arcSourceNode.sprite.tint = 0xffffff
        this.arcSourceNode = sourceNode
        this.arcSourceNode.sprite.tint = 0x71beeb

        // get node data
        this.name = this.xmlNodeService.getNodeNameById(this.arcSourceNode.id)

        if (sourceNode.nodeType == NodeType.transition) {
            this.transitionSelected = true
            this.role = this.xmlTransitionService.getTransitionRole(this.arcSourceNode.id)
        }

        if (sourceNode.nodeType == NodeType.place) {
            this.placeSelected = true
            this.data = this.xmlPlaceService.getPlaceTokenSchema(this.arcSourceNode.id)
            this.tokenSchemaName = this.xmlPlaceService.getPlaceTokenSchemaName(this.arcSourceNode.id)
            this.superClassSelected = this.xmlPlaceService.getPlaceSuperClassNameById(this.arcSourceNode.id)

            // Get the list of available superclasses for inheritance selection
            this.superClasses = this.xmlPlaceService.getDistinctTokenSchemaNames()
            this.superClasses = this.superClasses.filter(e => e !== (sourceNode as Place).tokenSchemaName);
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
        this.xmlTransitionService.updateTransitionRole(this.arcSourceNode.id, this.role)
    }

    addRow() {
        const newRow = { name: '', type: '', isPrimaryKey: false, isEdit: true }
        this.data = [...this.data, newRow]
    }

    // eslint-disable-next-line
    addRowDone(element: any) {
        element.isEdit = !element.isEdit
        this.updatePlaceTokenSchema()
    }

    updatePlaceTokenSchema() {
        (this.arcSourceNode as Place).updatePlaceTokenSchema(this.tokenSchemaName, this.data, this.superClassSelected, this.xmlPlaceService)

        // delete the current superClass and Attributes, when the user deletes the markingname
        if(!Boolean(this.tokenSchemaName)) {
            this.superClassSelected = []
            this.data = []
        }
    }

    removeRow(name: string) {
        this.data = this.data.filter((u) => u.name !== name)
        this.updatePlaceTokenSchema()
    }

    saveNetToXML() {
        localStorage.setItem('designerData', new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
        localStorage.setItem('netVersion', appVersion)
        this._snackBar.open('Saved net to XML in local storage', '', { duration: 2000 })
    }

    saveNetToClipboard() {
        this.clipboard.copy(new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
        this._snackBar.open('Saved net to clipboard', '', { duration: 2000 })
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
                this._snackBar.open('Successfully imported clipboard content', '', { duration: 2000 })
            })
            .catch((err) => {
                if (backup) {
                    localStorage.setItem('designerData', backup)
                    this.nodeReferenceList = []
                    if (Global.app) Global.app.destroy()
                    this.ngAfterViewInit()
                }

                this._snackBar.open('Failed to parse clipboard content ' + err, 'Close')
            })
    }

    ngOnDestroy(): void {
        if (Global.app) Global.app.destroy()
        this.saveNetToXML()
    }
}
