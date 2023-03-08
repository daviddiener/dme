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
    public getAllTransitions(): NodeListOf<Element> {
        const pageTag = Global.xmlDoc.querySelector("page")
        return pageTag ? pageTag.querySelectorAll("transition") : Global.xmlDoc.querySelectorAll("transition")
    }

    /**
     * Updates the role, assigned to the transition
     * @param id
     * @param newRole
     */
    public updateTransitionRole(id: string, newRole: string) {
        const node = Global.xmlDoc.querySelectorAll('[id="' + id + '"]')[0]

        // if the node alredy has a role, update it, otherwise create the necessary elements
        if (node.getElementsByTagName('owner')[0]) {
            if (node.getElementsByTagName('owner')[0].getElementsByTagName('text')[0]) {
                node.getElementsByTagName('owner')[0].getElementsByTagName('text')[0].textContent = newRole
            }
        } else {
            const owner = node.appendChild(Global.xmlDoc.createElement('owner'))
            const text2 = owner.appendChild(Global.xmlDoc.createElement('text'))
            text2.textContent = newRole
        }
    }

    /**
     * Return the role, assigned to the transition with the given id
     * @param id
     * @returns A string value
     */
    public getTransitionOwner(id: string): string {
        const owner = String(Global.xmlDoc.querySelectorAll('[id="' + id + '"] owner text')[0]?.textContent ?? '')
        return owner !== undefined ? owner : ''
    }

    /**
     * Returns all transition roles in the XML document. Does not return duplicate values, just distinct values.
     * @returns an array of strings
     */
    public getTransitionOwnersDistinct(): string[] {
        const tmp: string[] = []
        Global.xmlDoc.querySelectorAll('owner text').forEach((element) => {
            tmp.push(String(element.textContent ?? ''))
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
