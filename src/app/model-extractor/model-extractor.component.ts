import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { Global } from './../globals'
import { XMLPlaceService } from '../services/xml.place.service'
import { XMLTransitionService } from '../services/xml.transition.service'
import { XMLArcService } from '../services/xml.arc.service'
import { Clipboard } from '@angular/cdk/clipboard'
import { MatSnackBar } from '@angular/material/snack-bar'

const plantumlEncoder = require('plantuml-encoder')

@Component({
    selector: 'app-model-extractor',
    templateUrl: './model-extractor.component.html',
    styleUrls: ['./model-extractor.component.css'],
})
export class ModelExtractorComponent implements AfterViewInit {
    @ViewChild('pixiCanvasContainer') private div: ElementRef

    public relationList: {
        sourceName: string
        sourceCardinality: string
        targetName: string
        targetCardinality: string
    }[] = []

    private regex = /[^a-zA-Z]|\s/g

    private plantUMLString = 
        '@startuml \n' + 
        '!theme materia-outline \n' + 
        '!define primary_key(x) <b>★x</b> \n' + 
        'title DME Example - Class Diagram \n'

    constructor(
        private _snackBar: MatSnackBar,
        private xmlPlaceService: XMLPlaceService,
        private xmlTransitionService: XMLTransitionService,
        private xmlArcService: XMLArcService,
        private clipboard: Clipboard
    ) {}

    ngAfterViewInit(): void {
        // load XML file
        const designerData = localStorage.getItem('designerData')
        if (designerData) {
            Global.xmlDoc = new DOMParser().parseFromString(designerData, 'text/xml')

            this.generateClassesFromRoles()

            this.generateClassesFromTokenSchemas()

            this.generateCardinalitiesAroundTransitions()

            this.generateCardinalitiesFromRoles()

            // finish PlantUML string and display it as img
            this.plantUMLString += '@enduml \n'
            const plantUMLImage = document.getElementById('plantumlDiagram') as HTMLImageElement
            plantUMLImage.src = 'http://www.plantuml.com/plantuml/img/' + plantumlEncoder.encode(this.plantUMLString)
        } else alert('No valid xml string found')
    }

    generateClassesFromRoles() {
        this.xmlTransitionService.getTransitionOwnersDistinct().forEach((element) => {
            this.addClass(element, [])
        })
    }

    generateClassesFromTokenSchemas() {
        const objectsWithIncomingArcs: (string | null)[] = []
        Array.from(this.xmlArcService.getAllArcs()).forEach((element) => {
            objectsWithIncomingArcs.push(element.getAttribute('target'))
        })

        this.xmlPlaceService.getDistinctTokenSchemaNames().forEach((tokenSchemaName) => {
            // TODO: Update logic for internal external classes
            // set sprite tint to red if the class is an existing (external) object
            //   let color = 0xff0000
            //   if (objectsWithIncomingArcs.some((x) => x == String(place.getAttribute('id')))) {
            //       color = 0xffffff
            //   }
            this.addClass(tokenSchemaName, this.xmlPlaceService.getDistinctTokenSchemaByName(tokenSchemaName))
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
                    this.addComposition(
                        predecessorName,
                        String(predecessor.getElementsByTagName('hlinscription')[0].textContent),
                        successorName,
                        String(successor.getElementsByTagName('hlinscription')[0].textContent)
                    )
                }
            }
        })
    }

    generateCardinalitiesFromRoles() {
        console.log('=== Creating relation from transition role assignments ===')

        Array.from(this.xmlTransitionService.getTransitionOwners()).forEach((element) => {
            this.xmlArcService.getAllArcsWithSource(element.getAttribute('id')).forEach((arc) => {
                this.addComposition(
                    String(element.getElementsByTagName('owner')[0]?.getElementsByTagName('text')[0].textContent),
                    '1',
                    String(this.xmlPlaceService.getPlaceTokenSchemaName(String(arc.getAttribute('target')))),
                    '*'
                )
            })
        })
    }

    savePlantUMLToClipboard() {
        this.clipboard.copy(this.plantUMLString)
        this._snackBar.open('Saved PlantUML string to clipboard', '', { duration: 2000 })
    }

    addClass(name: string, attributes: { name: string; type: string; isPrimaryKey: boolean }[]) {
        this.plantUMLString += 'class ' + name.replace(this.regex, '') + ' \n'

        if (attributes.length > 0) {
            this.plantUMLString += '{ \n'
            attributes.forEach((element) => {
                let elementName = element.name.replace(this.regex, '')
                if(element.isPrimaryKey) elementName = 'primary_key(' + elementName + ')'
                
                this.plantUMLString += '+' + elementName + ' ' + element.type + ' \n'
            })
            this.plantUMLString += '} \n'
        }
    }

    addComposition(
        sourceName: string,
        sourceCardinality: string,
        targetName: string,
        targetCardinality: string,
        direction = ''
    ) {
        if (
            this.relationList.some(
                (el) =>
                    el.sourceName == sourceName &&
                    el.sourceCardinality == sourceCardinality &&
                    el.targetName == targetName &&
                    el.targetCardinality == targetCardinality
            )
        ) {
            console.log('found duplicate relation')
        } else {
            this.relationList.push({ sourceName, sourceCardinality, targetName, targetCardinality })

            this.plantUMLString +=
                sourceName.replace(this.regex, '') +
                ' "' +
                sourceCardinality +
                '" ' +
                '*-' +
                direction +
                '- ' +
                '"' +
                targetCardinality +
                '" ' +
                targetName.replace(this.regex, '') +
                ' \n'
        }
    }
}
