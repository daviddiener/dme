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
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement(nodeType))

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
            text2.textContent = '-'
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
        const name = Global.xmlDoc.querySelectorAll('[id="' + id + '"] name text')[0].textContent?.toString()

        return name !== undefined ? name : ''
    }
}
