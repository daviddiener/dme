import { Global } from './../globals'
import { Injectable } from '@angular/core'
const appVersion = require('../../../package.json').version

@Injectable({
    providedIn: 'root',
})
export class XMLPlaceService {
    /**
     * Returns the assigned token schema of a place from the XML document.
     * @param id
     * @returns An array of tuples including the name and type of all entries of the token schema
     */
    public getPlaceTokenSchema(id: string): { name: string; type: string, isPrimaryKey: boolean }[] {
        const data: { name: string; type: string, isPrimaryKey: boolean }[] = []

        const tokenSchema = Global.xmlDoc.querySelectorAll('place#' + id + ' > toolspecific[tool="dme"] > tokenSchema')

        if (tokenSchema.length > 0) {
            Array.from(tokenSchema[0].getElementsByTagName('xs:element')).forEach((element) => {
                data.push({
                    name: String(element.getAttribute('name')),
                    type: String(element.getAttribute('type')),
                    isPrimaryKey: Boolean(JSON.parse(String(element.getAttribute('isPrimaryKey')))),
                })
            })
        }
        return data
    }

    /**
     * Returns the assigned token schema name of a place from the XML document.
     * @param id
     * @returns A string with the token schema name
     */
    public getPlaceTokenSchemaName(id: string | null): string {
        const tokenSchema = Global.xmlDoc.querySelectorAll('place#' + id + ' > toolspecific[tool="dme"] > tokenSchema')
        if (tokenSchema.length > 0) {
            return String(tokenSchema[0].getAttribute('name'))
        } else {
            return ''
        }
    }

    /**
     * Update the token schema assigned to the place.
     * @param id
     * @param dataObjectName
     * @param data
     * @param superClassNames
     */
    public updatePlaceTokenSchema(id: string, dataObjectName: string, data: { name: string; type: string, isPrimaryKey: boolean }[], superClassNames: string[]) {
        const node = Global.xmlDoc.querySelector('place#' + id)
        if(node){
            // delete existing tokenSchema
            if (node.querySelectorAll('toolspecific[tool="dme"]').length > 0) {
                Array.from(node.querySelectorAll('toolspecific[tool="dme"]')).forEach(element => node.removeChild(element))
            }
            
            // create token schema tag again if a name is provided
            if(dataObjectName!=''){
                const toolspecific = node.appendChild(Global.xmlDoc.createElementNS('toolspecific', ''))
                toolspecific.setAttribute('tool', 'dme')
                toolspecific.setAttribute('version', appVersion)
                const tokenSchema = toolspecific.appendChild(Global.xmlDoc.createElement('tokenSchema'))
                tokenSchema.setAttribute('xmlns:xs', 'http://www.w3.org/2001/XMLSchema')
                tokenSchema.setAttribute('name', dataObjectName)
                tokenSchema.setAttribute('superClass', superClassNames.join(','))
    
                data.forEach((element) => {
                    const tmp = tokenSchema.appendChild(Global.xmlDoc.createElement('xs:element'))
                    tmp.setAttribute('name', element.name)
                    tmp.setAttribute('type', element.type)
                    tmp.setAttribute('isPrimaryKey', String(element.isPrimaryKey))
                })
            }
        }
    }

    /**
     * Returns all token schema names in the XML document. Does not return duplicates, just distinct values. 
     * The function takes into account the cascading order of superclasses, so that first the classes with 
     * the least amount of superclasses are resolved.
     * @returns an array of strings
     */
    public getDistinctTokenSchemaNames(): string[] {
        const schemaMap = new Map<string, Element>()
        Global.xmlDoc.querySelectorAll('toolspecific[tool="dme"] > tokenSchema').forEach((element) => {
          schemaMap.set(String(element.getAttribute('name')), element)
        })
      
        const sortedSchemas: Element[] = []
        const seenSchemas = new Set<string>()
        
        const visitSchema = (schemaName: string) => {
          if (!seenSchemas.has(schemaName)) {
            seenSchemas.add(schemaName)
            const schema = schemaMap.get(schemaName)
            if (schema) {
              const superClassList = schema.getAttribute('superClass')
              if (superClassList != null) {
                const superClasses = superClassList.split(',')
                for (const superClass of superClasses) {
                  visitSchema(superClass.trim())
                }
              }
              sortedSchemas.push(schema)
            }
          }
        }
      
        schemaMap.forEach((element, schemaName) => visitSchema(schemaName))
        return sortedSchemas.map((element) => String(element.getAttribute('name')))
      }
      

    /**
     * Returns all distinct token schema elements in the XML document for a given tokenSchemaName. Does not return duplicates, just distinct values.
     * @returns an array of schema objects
     */
    public getDistinctTokenSchemaByName(tokenSchemaName: string): { name: string; type: string, isPrimaryKey: boolean, isPrimaryKeyCombi: boolean }[] {
        const data: { name: string; type: string, isPrimaryKey: boolean, isPrimaryKeyCombi: boolean }[] = []

        Array.from(Global.xmlDoc.querySelectorAll('toolspecific[tool="dme"] > tokenSchema[name="' + tokenSchemaName + '"]')).forEach(
            (schemaElement) => {
                Array.from(schemaElement.getElementsByTagName('xs:element')).forEach((element) => {
                    // check if the data already includes an attribute with the same name, as we dont want duplicate attributes
                    if (!data.some((e) => e.name == element.getAttribute('name'))) {
                        data.push({
                            name: String(element.getAttribute('name')),
                            type: String(element.getAttribute('type')),
                            isPrimaryKey: Boolean(JSON.parse(String(element.getAttribute('isPrimaryKey')))),
                            isPrimaryKeyCombi: false
                        })
                    }
                })
            }
        )
        return data
    }

    /**
     * Returns all places in the XML document
     * @returns a collection of Elements
     */
    public getAllPlaces(): NodeListOf<Element> {
        const pageTag = Global.xmlDoc.querySelector("page")
        return pageTag ? pageTag.querySelectorAll("place") : Global.xmlDoc.querySelectorAll("place")
    }

     /**
     * Returns the assigned superClass name of a place from the XML document.
     * @param id
     * @returns A string with the superClass name
     */
     public getPlaceSuperClassNameById(id: string | null): string[] {
        return Global.xmlDoc.querySelectorAll('place#' + id + ' > toolspecific[tool="dme"] > tokenSchema')[0]?.getAttribute('superClass')?.split(',') ?? []
    }

    /**
     * Returns the first distinct superClass Names in the XML document for a given tokenSchemaName. Does not return duplicates, just distinct values.
     * @returns a string containing the superClass name
     */
    public getDistinctSuperClassNameByName(tokenSchemaName: string): string[] {
        let data: string[] = []
        const tokenSchemas = Global.xmlDoc.querySelectorAll('toolspecific[tool="dme"] > tokenSchema[name="' + tokenSchemaName + '"]')

        tokenSchemas.forEach(element => {
            data = data.concat(element.getAttribute('superClass')?.split(',') ?? [])
        });

        // remove all superClasses that are empty ''
        data = data.filter(e => e !== '');

        // return just unique values
        return [...new Set(data)]
    }
}
