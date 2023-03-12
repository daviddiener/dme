import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core'
import { Global } from './../globals'
import { XMLPlaceService } from '../services/xml.place.service'
import { XMLTransitionService } from '../services/xml.transition.service'
import { XMLArcService } from '../services/xml.arc.service'
import { XMLNodeService } from '../services/xml.node.service'
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

    public associationList: {
        sourceName: string
        sourceCardinality: string
        targetName: string
        targetCardinality: string,
        associationText: string
    }[] = []

    private classes: {
        name: string, 
        superClasses: string[], 
        attributes: { name: string; type: string; isPrimaryKey: boolean }[]
    }[] = []
    private associations: string[] = []

    private plantUMLString = 
        '@startuml \n' + 
        // 'skinparam linetype polyline \n' +
        '!theme materia-outline \n' + 
        '!define primary_key(x) <b>🔑x</b> \n' + 
        '!define foreign_key(x) <b>↩️x</b> \n' + 
        'title Generated Class Diagram \n'

    constructor(
        private _snackBar: MatSnackBar,
        private xmlPlaceService: XMLPlaceService,
        private xmlTransitionService: XMLTransitionService,
        private xmlArcService: XMLArcService,
        private xmlNodeService: XMLNodeService,
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

            this.flushToPlantUML()

            // finish PlantUML string and display it as img
            this.plantUMLString += '@enduml \n'
            const plantUMLImage = document.getElementById('plantumlDiagram') as HTMLImageElement
            plantUMLImage.src = 'http://www.plantuml.com/plantuml/img/' + plantumlEncoder.encode(this.plantUMLString)
        } else alert('No valid xml string found')
    }

    generateClassesFromRoles() {
        this.xmlTransitionService.getTransitionOwnersDistinct().forEach((element) => {
            if(element)
                this.classes.push({
                    'name': element, 
                    'superClasses': [], 
                    'attributes': [
                        {
                            name: element + '_id',
                            type: 'string',
                            isPrimaryKey: true
                        },
                        {
                            name: 'name',
                            type: 'string',
                            isPrimaryKey: false
                        }
                    ]
                })
        })
    }

    generateClassesFromTokenSchemas() {
        this.xmlPlaceService.getDistinctTokenSchemaNames().forEach((tokenSchemaName) => {
            this.classes.push({
                'name': tokenSchemaName, 
                'superClasses': this.xmlPlaceService.getDistinctSuperClassNameByName(tokenSchemaName), 
                'attributes': this.xmlPlaceService.getDistinctTokenSchemaByName(tokenSchemaName)
            })
        })

        this.xmlPlaceService.getAllPlaces().forEach((place) => {
            // if no name is set we give the name 'undefined class' to the class
            let name = this.xmlNodeService.getNodeNameById(place.getAttribute('id'))
            if(!name) name = 'undefinedClass'

            // if the class does not exist already, create it
            if (!this.classes.some((el) => el.name == name) ) {
                if(!place.querySelector('tokenSchema')) {
                    this.classes.push({
                        'name': name, 
                        'superClasses': [], 
                        'attributes': []
                    })
                }
            }
        })
    }

    generateCardinalitiesAroundTransitions() {
        // iterate through all transitions, and for each transition thorugh each combination of source and target arcs
        Array.from(this.xmlTransitionService.getAllTransitions()).forEach((transition) => {
            this.xmlArcService.getAllArcsWithTarget(transition.getAttribute('id')).forEach(predecessorArc => {
                this.xmlArcService.getAllArcsWithSource(transition.getAttribute('id')).forEach(successorArc => {
                    // check for null before extracting the names of the 2 classes we want to connect with a relation
                    if (successorArc && predecessorArc) {
                        let predecessorName = this.xmlPlaceService.getPlaceTokenSchemaName(predecessorArc.getAttribute('source'))
                        let successorName = this.xmlPlaceService.getPlaceTokenSchemaName(successorArc.getAttribute('target'))

                        // if there is no tokenSchma defined we fall back to the place name
                        if(!predecessorName) {
                            // if no name is set we give the name 'undefinedClass' to the class
                            predecessorName = this.xmlNodeService.getNodeNameById(predecessorArc.getAttribute('source'))
                            if(!predecessorName) predecessorName = 'undefinedClass'
                        }
                        // if there is no tokenSchma defined we fall back to the place name
                        if(!successorName) {
                            // if no name is set we give the name 'undefinedClass' to the class
                            successorName = this.xmlNodeService.getNodeNameById(successorArc.getAttribute('target'))
                            if(!successorName) successorName = 'undefinedClass'
                        }

                        // get the carindalities, it there is none, or they are invalid, default to *
                        let predecessorCardinality = predecessorArc.getElementsByTagName('hlinscription')[0]?.textContent?.trim()
                        if(!predecessorCardinality) predecessorCardinality = "*"
                        let successorCardinality = successorArc.getElementsByTagName('hlinscription')[0]?.textContent?.trim()
                        if(!successorCardinality) successorCardinality = "*"

                        // if the names of the classes are the same we dont want to generate a relation
                        if (predecessorName != successorName) {
                            this.addComposition(
                                predecessorName,
                                predecessorCardinality,
                                successorName,
                                successorCardinality,
                                this.xmlNodeService.getNodeTextById(String(transition.getAttribute('id'))),
                                'down'
                            )
                        }
                    }
                })
            })
        })
    }

    generateCardinalitiesFromRoles() {
        Array.from(this.xmlTransitionService.getTransitionOwners()).forEach((element) => {
            this.xmlArcService.getAllArcsWithSource(element.getAttribute('id')).forEach((arc) => {
                let name = String(this.xmlPlaceService.getPlaceTokenSchemaName(arc.getAttribute('target')))

                // if there is no tokenSchma defined we fall back to the place name
                if(!name) {
                    // if no name is set we give the name 'undefinedClass' to the class
                    name = this.xmlNodeService.getNodeNameById(arc.getAttribute('target'))
                    if(!name) name = 'undefinedClass'
                }
                
                this.addComposition(
                    element.querySelector("owner > text")?.textContent ?? '',
                    '1',
                    name,
                    '*',
                    'instantiated by'
                )
            })
        })
    }

    savePlantUMLToClipboard() {
        this.clipboard.copy(this.plantUMLString)
        this._snackBar.open('Saved PlantUML string to clipboard', '', { duration: 2000 })
    }

    addComposition(
        sourceName: string,
        sourceCardinality: string,
        targetName: string,
        targetCardinality: string,
        associationText: string,
        direction = ''
    ) {
        // If we cant find a duplicate relation in the relationList --> then we create the relation
        if (
            !this.associationList.some(
                (el) =>
                    el.sourceName == sourceName &&
                    el.sourceCardinality == sourceCardinality &&
                    el.targetName == targetName &&
                    el.targetCardinality == targetCardinality &&
                    el.associationText == associationText
            ) 
            && targetName 
            && sourceName
        ) {
            let primary_key_name = sourceName + '_id'
            let primary_key_type = 'string'

            // Returns the first primary key from tokenSchema for the source name
            const primaryKey = this.xmlPlaceService.getDistinctTokenSchemaByName(sourceName).find(x => x.isPrimaryKey)
            if(primaryKey){
                primary_key_name = primaryKey.name
                primary_key_type = primaryKey.type
            }

            // add the foreign key to the target class of this relation
            this.classes[this.classes.findIndex(x => x.name == targetName)].attributes.push({
                name: 'foreign_key(' + primary_key_name + ')',
                type: primary_key_type,
                isPrimaryKey: false
            })

            this.associationList.push({ sourceName, sourceCardinality, targetName, targetCardinality, associationText })
            
            this.associations.push(
                '"' +
                sourceName +
                '::' +
                primary_key_name +
                '" "' +
                sourceCardinality +
                '" ' +
                '*-' +
                direction +
                '- "' +
                targetCardinality +
                '" "' +
                targetName +
                '::' +
                primary_key_name + 
                '" : "' +
                associationText +
                '" \n'
            )
        }
    }

    flushToPlantUML(){
        this.classes.forEach(classElement =>{
            let inheritanceString = ''
            // extend the superclass if it exists
            if(classElement.superClasses.length > 0) {
                inheritanceString = ' extends ' 
                // iterate through all superClasses if we have mutiple defined
                classElement.superClasses.forEach(element => {
                    inheritanceString += element+','
                });
                // remove last comma so syntax of PlantUML doesnt break
                inheritanceString=inheritanceString.slice(0, -1);
            }
    
            // generate the class heading
            this.plantUMLString += 'class "' + classElement.name + '"' + inheritanceString + '\n{\n'

            // generate a primary key if there is none specified
            if(!classElement.attributes.some(x => x.isPrimaryKey)) {
                this.plantUMLString += '+primary_key(' + classElement.name + '_id) string \n'
            }
                    
            // generate the list of attributes
            if (classElement.attributes.length > 0) {
                classElement.attributes.forEach((attribute) => {
                    let elementName = attribute.name
                    if(attribute.isPrimaryKey) elementName = 'primary_key(' + elementName + ')'
                    
                    this.plantUMLString += '+' + elementName + ' ' + attribute.type + ' \n'
                })
            }

            // close the class definition
            this.plantUMLString += '}\n'
        })

        this.associations.forEach(associationElement =>{
            this.plantUMLString += associationElement
        })
       
    }
}
