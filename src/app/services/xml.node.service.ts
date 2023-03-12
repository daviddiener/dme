import { Global } from './../globals'
import { NodeType } from '../entities/node'
import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class XMLNodeService {
    /**
     * Creates a new node object in the XML document.
     * @param id a UUID
     * @param x the x coordinate for the graphics representation
     * @param y the x coordinate for the graphics representation
     * @param textValue the inscription text
     * @param nodeType the node type can be a transition or place
     */
    public createNode(id: string, x: number, y: number, textValue: string, nodeType: NodeType) {

        const pageTag = Global.xmlDoc.querySelector("page")
        const netTag = Global.xmlDoc.querySelector("net")
        const parent = pageTag ? pageTag.appendChild(Global.xmlDoc.createElement(nodeType)) : 
                       netTag ? netTag.appendChild(Global.xmlDoc.createElement(nodeType)) : Global.xmlDoc.createElement(nodeType)

        parent.setAttribute('id', id)

        const graphics = parent.appendChild(Global.xmlDoc.createElement('graphics'))
        const position = graphics.appendChild(Global.xmlDoc.createElement('position'))

        position.setAttribute('x', Math.round(x).toString())
        position.setAttribute('y', Math.round(y).toString())

        const name = parent.appendChild(Global.xmlDoc.createElement('name'))
        const text = name.appendChild(Global.xmlDoc.createElement('text'))
        text.textContent = textValue

        // if the node is a transition, create a ownership tag
        if (nodeType == NodeType.transition) {
            const owner = parent.appendChild(Global.xmlDoc.createElement('owner'))
            const text2 = owner.appendChild(Global.xmlDoc.createElement('text'))
            text2.textContent = ''
        }
    }

    /**
     * Updates the graphics position of a node object in the XML document.
     * @param id
     * @param x
     * @param y
     */
    public updateNodePosition(id: string, x: number, y: number) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('x', Math.round(x).toString())
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('y', Math.round(y).toString())
    }

    /**
     * Updates the name of a node.
     * @param id
     * @param newName
     */
    public updateNodeName(id: string, newName: string) {
        Global.xmlDoc.querySelectorAll('[id="' + id + '"] name text')[0].textContent = newName
    }

    /**
     * Returns the graphical position a node.
     * @param id
     * @returns A tuple of numbers representing the x and y positions.
     */
    public getNodePosition(id: string): [number, number] {
        const x = Number(Global.xmlDoc.querySelectorAll('[id="' + id + '"] graphics position')[0].getAttribute('x'))
        const y = Number(Global.xmlDoc.querySelectorAll('[id="' + id + '"] graphics position')[0].getAttribute('y'))

        return [x, y]
    }

    /**
     * Returns the name of a node based on the id.
     * @param id
     * @returns A string containing the name of the node.
     */
    public getNodeNameById(id: string | null): string {
        const name = Global.xmlDoc.querySelector('[id="' + id + '"] name text')
        if(name && name.textContent) return name.textContent
        else return ''
    }

    /**
     * Return the text, assigned to the node with the given id
     * @param id
     * @returns A string value
     */
    public getNodeTextById(id: string): string {
        const text = String(Global.xmlDoc.querySelectorAll('[id="' + id + '"] name text')[0]?.textContent ?? '')
        return text !== undefined ? text : ''
    }
}
