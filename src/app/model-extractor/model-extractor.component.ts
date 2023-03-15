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
        attributes: { name: string; type: string; isPrimaryKey: boolean, isPrimaryKeyCombi: boolean }[]
    }[] = []
    private associations: string[] = []
    private plantUMLString: string
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
        } else alert('No valid xml string found')
    }

    generateClassesFromRoles() {
        this.xmlTransitionService.getTransitionRolesDistinct().forEach((element) => {
            if(element)
                this.classes.push({
                    'name': element, 
                    'superClasses': [], 
                    'attributes': [
                        {
                            name: element + '_id',
                            type: 'string',
                            isPrimaryKey: true,
                            isPrimaryKeyCombi: true
                        },
                        {
                            name: 'name',
                            type: 'string',
                            isPrimaryKey: false,
                            isPrimaryKeyCombi: false
                        }
                    ]
                })
        })
    }

    generateClassesFromTokenSchemas() {
        // In this section we add all classes that are derived from tokenSchemas
        this.xmlPlaceService.getDistinctTokenSchemaNames().forEach((tokenSchemaName) => {
            const primary_key = this.getPKCombination(tokenSchemaName)            
            const attributes = this.xmlPlaceService.getDistinctTokenSchemaByName(tokenSchemaName)
            
            // add the PK here if it is not included by default. This is the case with inherited or combined PKs. 
            // We override the PK rather than leaving the old one, because the isPrimaryKeyCombi may be different
            // if(!attributes.some(x => x.name == primary_key.name)) {
            //     attributes.push(primary_key)
            // }
            const existingIndex = attributes.findIndex((x) => x.name === primary_key.name);
            if (existingIndex !== -1) {
                attributes[existingIndex] = primary_key;
            } else {
                attributes.push(primary_key);
            }

            this.classes.push({
                'name': tokenSchemaName, 
                'superClasses': this.xmlPlaceService.getDistinctSuperClassNameByName(tokenSchemaName), 
                'attributes': attributes
            })
        })

        // In this section we add the remaining classes that don't include tokenSchemas via place names
        this.xmlPlaceService.getAllPlaces().forEach((place) => {
            // if not even a name is set we give the name 'undefined class' to the class
            let name = this.xmlNodeService.getNodeNameById(place.getAttribute('id'))
            if(!name) name = 'undefinedClass'            

            // if the class does not exist already, create it
            if (!this.classes.some((el) => el.name == name) ) {
                if(!place.querySelector('toolspecific[tool="dme"] > tokenSchema')) {
                    this.classes.push({
                        'name': name, 
                        'superClasses': [], 
                        'attributes': [this.getPKCombination(name)]
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
        Array.from(this.xmlTransitionService.getTransitionRoles()).forEach((element) => {
            this.xmlArcService.getAllArcsWithSource(element.getAttribute('id')).forEach((arc) => {
                let name = String(this.xmlPlaceService.getPlaceTokenSchemaName(arc.getAttribute('target')))

                // if there is no tokenSchma defined we fall back to the place name
                if(!name) {
                    // if no name is set we give the name 'undefinedClass' to the class
                    name = this.xmlNodeService.getNodeNameById(arc.getAttribute('target'))
                    if(!name) name = 'undefinedClass'
                }
                
                this.addComposition(
                    element.querySelector('toolspecific[tool="dme"] > role > text')?.textContent ?? '',
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
            const primary_key = this.getPKCombination(sourceName)

            // add the foreign key to the target class of this relation if it does not exist already
            const target = this.classes[this.classes.findIndex(x => x.name == targetName)]
            if(!target.attributes.some(x => x.name === 'foreign_key(' + primary_key.name + ')')) {
                target.attributes.push({
                    name: 'foreign_key(' + primary_key.name + ')',
                    type: primary_key.type,
                    isPrimaryKey: false,
                    isPrimaryKeyCombi: false
                })
            }
            
            this.associationList.push({ sourceName, sourceCardinality, targetName, targetCardinality, associationText })
            
            this.associations.push(
                '"' +
                sourceName +
                '::' +
                primary_key.name +
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
                primary_key.name + 
                '" : "' +
                associationText +
                '" \n'
            )
        }
    }

    /**
     * Calculates the primary key. If there is a superclass, or multiple PK defined in this class we build the combination of all PKs available for this class.
     * @param sourceName 
     * @returns A unique (combined) primary key for the given class
     */
    getPKCombination(sourceName: string) {
        // Returns the first primary key from tokenSchema for the source name
        let primaryKeys = this.xmlPlaceService.getDistinctTokenSchemaByName(sourceName).filter(x => x.isPrimaryKey)
        const superclassesOfSource = this.xmlPlaceService.getDistinctSuperClassNameByName(sourceName)

        // if base class has superclass we take the PK combination from there and concat it to the PK of the base blass
        superclassesOfSource.forEach(superC =>{
            primaryKeys = primaryKeys.concat(this.classes.find(x => x.name === superC)?.attributes.filter(x => x.isPrimaryKey && x.isPrimaryKeyCombi) ?? [])
        })

        // delete duplicate entries from the PK array. This is necessary if we have recorsuive superclass definitions. 
        // Duplicate PK combinations would be added here in this case and we dont want that.
        primaryKeys = primaryKeys.filter(
            (elem, index, self) => index === self.findIndex((e) => e.name === elem.name)
        )

        let primary_key_name = ''
        let primary_key_type = 'string'

        // if we found some PKs we add them combined
        if(primaryKeys.length != 0) {
            if(primaryKeys.length == 1) primary_key_type = primaryKeys[0].type
        
            primaryKeys.forEach(pk => {
                primary_key_name += pk.name + '|'
            })
            
            // remove the last '|'
            primary_key_name = primary_key_name.slice(0, -1)
        // otherwise we use a generic PK
        } else{
            primary_key_name = sourceName + '_id'
        }

        return {name: primary_key_name, type: primary_key_type, isPrimaryKey: true, isPrimaryKeyCombi: true}
    }

    flushToPlantUML(){
        this.plantUMLString = 
            '@startuml \n' + 
            // 'skinparam linetype polyline \n' +
            '!theme materia-outline \n' + 
            '!define primary_key(x) <b>🔑x</b> \n' + 
            '!define foreign_key(x) <b>↩️x</b> \n' + 
            'title ' + (Global.xmlDoc.querySelector('pnml > net > name > text')?.textContent ?? 'Generated Class Diagram') + ' \n'

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


            // sort the attributes
            classElement.attributes.sort((a, b) => {
                if (a.isPrimaryKeyCombi === b.isPrimaryKeyCombi) {
                  if (a.isPrimaryKey === b.isPrimaryKey) {
                    return 0; // Do not swap elements
                  } else {
                    return a.isPrimaryKey ? -1 : 1; // Primary key first
                  }
                } else {
                  return b.isPrimaryKeyCombi ? 1 : -1; // Primary key combination first
                }
              });

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

        this.plantUMLString += '@enduml \n'
        const plantUMLImage = document.getElementById('plantumlDiagram') as HTMLImageElement
        plantUMLImage.src = 'http://www.plantuml.com/plantuml/img/' + plantumlEncoder.encode(this.plantUMLString)
    }
}
