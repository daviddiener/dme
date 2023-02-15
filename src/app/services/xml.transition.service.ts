import { Global } from './../globals'
import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class XMLTransitionService {
    /**
     * Returns all transitions in the XML document.
     * @returns A collection of elements.
     */
    public getAllTransitions(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('transition')
    }

    /**
     * Updates the role, assigned to the transition
     * @param id
     * @param newOwner
     */
    public updateTransitionOwner(id: string, newOwner: string) {
        Global.xmlDoc.querySelectorAll('[id="' + id + '"] owner text')[0].textContent = newOwner
    }

    /**
     * Return the role, assigned to the transition with the given id
     * @param id
     * @returns A string value
     */
    public getTransitionOwner(id: string): string {
        const owner = Global.xmlDoc.querySelectorAll('[id="' + id + '"] owner text')[0].textContent?.toString()

        return owner !== undefined ? owner : ''
    }

    /**
     * Returns all transition roles in the XML document. Does not return duplicate values, just distinct values.
     * @returns an array of strings
     */
    public getTransitionOwnersDistinct(): string[] {
        const tmp: string[] = []
        Global.xmlDoc.querySelectorAll('owner text').forEach((element) => {
            tmp.push(String(element.textContent))
        })

        const uniqueItems = [...new Set(tmp)]
        return uniqueItems
    }

    /**
     * Returns all transition roles in the XML document.
     * @returns an array of elements
     */
    public getTransitionOwners(): Element[] {
        const tmp: Element[] = []
        Global.xmlDoc.querySelectorAll('transition').forEach((element) => {
            tmp.push(element)
        })

        return tmp
    }
}
