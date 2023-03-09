import { Global } from './../globals'
import { Injectable } from '@angular/core'

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

        const tokenSchema = Global.xmlDoc.querySelectorAll('[id="' + id + '"] tokenSchema')

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
        const tokenSchema = Global.xmlDoc.querySelectorAll('[id="' + id + '"] tokenSchema')
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
     * @param superClassName
     */
    public updatePlaceTokenSchema(id: string, dataObjectName: string, data: { name: string; type: string, isPrimaryKey: boolean }[], superClassName: string) {
        const node = Global.xmlDoc.querySelectorAll('[id="' + id + '"]')

        if (node[0].getElementsByTagName('tokenSchema').length > 0) {
            node[0].removeChild(node[0].getElementsByTagName('tokenSchema')[0])
        }

        // create token schema tag again
        const tokenSchema = node[0].appendChild(Global.xmlDoc.createElement('tokenSchema'))
        tokenSchema.setAttribute('xmlns:xs', 'http://www.w3.org/2001/XMLSchema')
        tokenSchema.setAttribute('name', dataObjectName)
        tokenSchema.setAttribute('superClass', superClassName)


        data.forEach((element) => {
            const tmp = tokenSchema.appendChild(Global.xmlDoc.createElement('xs:element'))
            tmp.setAttribute('name', element.name)
            tmp.setAttribute('type', element.type)
            tmp.setAttribute('isPrimaryKey', String(element.isPrimaryKey))
        })
    }

    /**
     * Returns all token schema names in the XML document. Does not return duplicates, just distinct values.
     * @returns an array of strings
     */
    public getDistinctTokenSchemaNames(): string[] {
        const tmp: string[] = []
        Global.xmlDoc.querySelectorAll('tokenSchema').forEach((element) => {
            tmp.push(String(element.getAttribute('name')))
        })

        const uniqueItems = [...new Set(tmp)]
        return uniqueItems
    }

    /**
     * Returns all distinct token schema elements in the XML document for a given tokenSchemaName. Does not return duplicates, just distinct values.
     * @returns an array of schema objects
     */
    public getDistinctTokenSchemaByName(tokenSchemaName: string): { name: string; type: string, isPrimaryKey: boolean }[] {
        const data: { name: string; type: string, isPrimaryKey: boolean }[] = []

        Array.from(Global.xmlDoc.querySelectorAll('tokenSchema[name="' + tokenSchemaName + '"]')).forEach(
            (schemaElement) => {
                Array.from(schemaElement.getElementsByTagName('xs:element')).forEach((element) => {
                    // check if the data already includes an attribute with the same name, as we dont want duplicate attributes
                    if (!data.some((e) => e.name == element.getAttribute('name'))) {
                        data.push({
                            name: String(element.getAttribute('name')),
                            type: String(element.getAttribute('type')),
                            isPrimaryKey: Boolean(JSON.parse(String(element.getAttribute('isPrimaryKey')))),
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
     public getPlaceSuperClassName(id: string | null): string {

        return Global.xmlDoc.querySelectorAll('[id="' + id + '"] tokenSchema')[0]?.getAttribute('superClass') ?? ''

        // const superClass = Global.xmlDoc.querySelectorAll('[id="' + id + '"] tokenSchema')
        // if (superClass.length > 0) {
        //     return String(superClass[0].getAttribute('superClass') ?? '')
        // } else {
        //     return ''
        // }
    }

    /**
     * Returns the first distinct superClass Names in the XML document for a given tokenSchemaName. Does not return duplicates, just distinct values.
     * @returns a string containing the superClass name
     */
    public getDistinctSuperClassNameByName(tokenSchemaName: string): string[] {
        let data: string[] = []
        const tokenSchemas = Global.xmlDoc.querySelectorAll('tokenSchema[name="' + tokenSchemaName + '"]')

        tokenSchemas.forEach(element => {
            data.push(String(element.getAttribute('superClass') ?? ''))
        });

        // remove all superClasses that are empty ''
        data = data.filter(e => e !== '');

        // return just unique values
        return [...new Set(data)]
    }
}
