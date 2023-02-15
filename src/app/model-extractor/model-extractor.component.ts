import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core'
import { Global } from './../globals'
import { NodeEntity } from '../entities/nodeEntity'
import { Relation } from '../entities/relation'
import { ClassEntity } from '../entities/classEntity'
import { getUUID, initializePixiApplication } from '../services/helper.service'
import { XMLNodeService } from '../services/xml.node.service'
import { XMLPlaceService } from '../services/xml.place.service'
import { XMLTransitionService } from '../services/xml.transition.service'
import { XMLArcService } from '../services/xml.arc.service'

@Component({
    selector: 'app-model-extractor',
    templateUrl: './model-extractor.component.html',
    styleUrls: ['./model-extractor.component.css'],
})
export class ModelExtractorComponent implements AfterViewInit {
    @ViewChild('pixiCanvasContainer') private div: ElementRef
    private classReferenceList: NodeEntity[] = []
    private relationReferenceList: Relation[] = []

    constructor(
        private ngZone: NgZone,
        private xmlNodeService: XMLNodeService,
        private xmlPlaceService: XMLPlaceService,
        private xmlTransitionService: XMLTransitionService,
        private xmlArcService: XMLArcService
    ) {}

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
            initializePixiApplication()

            this.div.nativeElement.innerHTML = ''
            this.div.nativeElement.appendChild(Global.app.view)
            this.adjustCanvasSize()

            // load XML file
            const designerData = localStorage.getItem('designerData')
            if (designerData) {
                Global.xmlDoc = new DOMParser().parseFromString(designerData, 'text/xml')

                this.generateOwners()

                this.generateClassesFromMarkings()

                this.generateCardinalitiesAroundTransitions()

                this.generateCardinalitiesFromRoles()
            } else alert('No valid xml string found')
        })
    }

    generateCardinalitiesAroundTransitions() {
        console.log('=== Creating relation that are connected by a transition ===')

        Array.from(this.xmlTransitionService.getAllTransitions()).forEach((element) => {
            const id = element.getAttribute('id')
            const predecessor = this.xmlArcService.getAllArcsWithTarget(id)[0]
            const successor = this.xmlArcService.getAllArcsWithSource(id)[0]

            // check for null before extracting the names of the 2 classes we want to connect with a relation
            if (successor && predecessor) {
                const predecessorName = this.xmlPlaceService.getPlaceTokenSchemaName(predecessor.getAttribute('source'))
                const successorName = this.xmlPlaceService.getPlaceTokenSchemaName(successor.getAttribute('target'))

                // if the names of the classes are the same we dont want to generate a relation
                if (predecessorName != successorName) {
                    this.addRelation(
                        predecessorName,
                        successorName,
                        String(predecessor.getElementsByTagName('hlinscription')[0].textContent),
                        String(successor.getElementsByTagName('hlinscription')[0].textContent)
                    )
                }
            }
        })
    }

    generateCardinalitiesFromRoles() {
        console.log('=== Creating relation from transition role assignments ===')

        Array.from(this.xmlTransitionService.getTransitionOwners()).forEach((element) => {
            /*  
                Make sure to keep track of the list of created relations with their source and target classes
                Always check if the relation from source to target class already exists.
                We just have to check if the relation exists, not which cardinality it implements, because the cardinality is alwazs 1-N in Rule 2.2
            */
            this.xmlArcService.getAllArcsWithSource(element.getAttribute('id')).forEach((arc) => {
                const sourceName = String(
                    element.getElementsByTagName('owner')[0].getElementsByTagName('text')[0].textContent
                )
                const targetName = String(
                    this.xmlPlaceService.getPlaceTokenSchemaName(String(arc.getAttribute('target')))
                )

                const sourceRef = this.relationReferenceList.find((el) => el.startNode.textValue == sourceName)
                const targetRef = this.relationReferenceList.find((el) => el.targetNode.textValue == targetName)

                // continue creation only if a duplicate relation does not already exist
                if (!(sourceRef && targetRef)) {
                    const relation = this.addRelation(sourceName, targetName, '1', '*')

                    if (relation) this.relationReferenceList.push(relation)
                } else {
                    console.log('Skipping because of duplicate Relation from ' + sourceName + ' to ' + targetName)
                }
            })
        })
    }

    generateClassesFromMarkings() {
        let xPosition = 100
        let yPosition = 250

        const objectsWithIncomingArcs: (string | null)[] = []
        Array.from(this.xmlArcService.getAllArcs()).forEach((element) => {
            objectsWithIncomingArcs.push(element.getAttribute('target'))
        })

        Array.from(this.xmlPlaceService.getAllPlaces()).forEach((place) => {
            const marking = place.getElementsByTagName('marking')
            // check if the place has a marking
            if (marking.length > 0) {
                // check if a class with the same marking name has already been created
                if (
                    this.classReferenceList.find((el) => el.textValue == marking[0].getAttribute('name')) == undefined
                ) {
                    // set sprite tint to red if the class is an existing (external) object
                    let color = 0xff0000
                    if (objectsWithIncomingArcs.some((x) => x == String(place.getAttribute('id')))) {
                        color = 0xffffff
                    }

                    // create the class
                    this.classReferenceList.push(
                        new ClassEntity(
                            getUUID(),
                            xPosition,
                            yPosition,
                            String(marking[0].getAttribute('name')),
                            undefined,
                            this.xmlNodeService,
                            color
                        )
                    )

                    xPosition += 75
                    yPosition += 50
                }
            }
        })
    }

    generateOwners() {
        let xPosition = 100
        this.xmlTransitionService.getTransitionOwnersDistinct().forEach((element) => {
            this.classReferenceList.push(
                new ClassEntity(getUUID(), xPosition, 50, element, undefined, this.xmlNodeService, 0xffffff)
            )

            xPosition += 150
        })
    }

    adjustCanvasSize() {
        Global.app.renderer.resize(this.div.nativeElement.offsetWidth, this.div.nativeElement.offsetHeight)
    }

    addRelation(sourceName: string, targetName: string, textValueC1: string, textValueC2: string) {
        // checks if the source and target nodes that will be connected actually exist
        const sourceRef = this.classReferenceList.find((el) => el.textValue == sourceName)
        const targetRef = this.classReferenceList.find((el) => el.textValue == targetName)

        let tmpRelation
        if (sourceRef && targetRef) {
            tmpRelation = new Relation(sourceRef, targetRef, sourceRef.sprite, textValueC1, textValueC2)

            sourceRef.relationList.push(tmpRelation)
            targetRef.relationList.push(tmpRelation)

            console.log('created relation from ' + sourceName + ' to ' + targetName)
        }
        return tmpRelation
    }
}
