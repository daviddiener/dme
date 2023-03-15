import { Global } from './../globals'
import { Injectable } from '@angular/core'
const appVersion = require('../../../package.json').version

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
        if (node.querySelector('toolspecific[tool="dme"] > role')) {
            if (node.getElementsByTagName('role')[0].getElementsByTagName('text')[0]) {
                node.getElementsByTagName('role')[0].getElementsByTagName('text')[0].textContent = newRole
            }
        } else {
            const toolspecific = node.appendChild(Global.xmlDoc.createElement('toolspecific'))
            toolspecific.setAttribute('tool', 'dme')
            toolspecific.setAttribute('version', appVersion)
            const role = toolspecific.appendChild(Global.xmlDoc.createElement('role'))
            const text2 = role.appendChild(Global.xmlDoc.createElement('text'))
            text2.textContent = newRole
        }
    }

    /**
     * Return the role, assigned to the transition with the given id
     * @param id
     * @returns A string value
     */
    public getTransitionRole(id: string): string {
        const role = String(Global.xmlDoc.querySelectorAll('transition#' + id + ' > toolspecific[tool="dme"] > role > text')[0]?.textContent ?? '')
        return role !== undefined ? role : ''
    }

    /**
     * Returns all transition roles in the XML document. Does not return duplicate values, just distinct values.
     * @returns an array of strings
     */
    public getTransitionRolesDistinct(): string[] {
        const tmp: string[] = []
        Global.xmlDoc.querySelectorAll('toolspecific[tool="dme"] > role > text').forEach((element) => {
            tmp.push(String(element.textContent ?? ''))
        })

        const uniqueItems = [...new Set(tmp)]
        return uniqueItems
    }

    /**
     * Returns all transition roles in the XML document.
     * @returns an array of elements
     */
    public getTransitionRoles(): Element[] {
        const tmp: Element[] = []
        Global.xmlDoc.querySelectorAll('transition').forEach((element) => {
            tmp.push(element)
        })

        return tmp
    }
}
