import { Injectable } from '@angular/core'
import { Global } from './../globals'

export enum NodeType {
    place = 'place',
    transition = 'transition',
}

@Injectable({
    providedIn: 'root',
})
export class XMLService {
    public createNewXMLDocument() {
        console.log('Local storage empty. Starting from scratch...')
        Global.xmlDoc = document.implementation.createDocument(null, 'pnml')

        const pnml = Global.xmlDoc.getElementsByTagName('pnml')[0]
        const net = pnml.appendChild(Global.xmlDoc.createElement('net'))
        net.appendChild(Global.xmlDoc.createElement('page'))
    }

    public createNode(
        id: string,
        x: number,
        y: number,
        textValue: string,
        nodeType: NodeType
    ) {
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement(nodeType))

        parent.setAttribute('id', id)

        const graphics = parent.appendChild(
            Global.xmlDoc.createElement('graphics')
        )
        const position = graphics.appendChild(
            Global.xmlDoc.createElement('position')
        )

        position.setAttribute('x', x.toString())
        position.setAttribute('y', y.toString())

        const name = parent.appendChild(Global.xmlDoc.createElement('name'))
        const text = name.appendChild(Global.xmlDoc.createElement('text'))
        text.textContent = textValue

        const owner = parent.appendChild(Global.xmlDoc.createElement('owner'))
        const text2 = owner.appendChild(Global.xmlDoc.createElement('text'))
        text2.textContent = '-'
    }

    public createArc(
        id: string,
        startId: string,
        targetId: string,
        textValue: string
    ) {
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement('arc'))

        parent.setAttribute('id', id)
        parent.setAttribute('source', startId)
        parent.setAttribute('target', targetId)

        const inscription = parent.appendChild(
            Global.xmlDoc.createElement('inscription')
        )
        const text = inscription.appendChild(
            Global.xmlDoc.createElement('text')
        )
        text.textContent = textValue
    }

    public updateNodePosition(id: string, x: number, y: number) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('x', x.toString())
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('y', y.toString())
    }

    public updateNodeName(id: string, newName: string) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] name text')[0]
            .textContent = newName        
    }

    public getNodeName(id: string) : string {
        const name = Global.xmlDoc
        .querySelectorAll('[id="' + id + '"] name text')[0]
        .textContent?.toString()

        return name !== undefined ? name : '';
    }

    public updateNodeOwner(id: string, newOwner: string) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] owner text')[0]
            .textContent = newOwner        
    }

    public getNodeOwner(id: string) : string {
        const owner = Global.xmlDoc
        .querySelectorAll('[id="' + id + '"] owner text')[0]
        .textContent?.toString()

        return owner !== undefined ? owner : '';
    }

    public getAllOwners() : any[]{

        const tmp = new Array();
        Global.xmlDoc.querySelectorAll('owner text').forEach(element => {
            tmp.push(element.textContent)
        })
                
        let uniqueItems = [...new Set(tmp)]
        return uniqueItems
    }

    public getAllPlaces(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('place')
    }

    public getAllTransitions(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('transition')
    }

    public getNodePosition(id: string): [number, number] {
        const x = Number(
            Global.xmlDoc
                .querySelectorAll('[id="' + id + '"] graphics position')[0]
                .getAttribute('x')
        )
        const y = Number(
            Global.xmlDoc
                .querySelectorAll('[id="' + id + '"] graphics position')[0]
                .getAttribute('y')
        )

        return [x, y]
    }

    public getAllArcs(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('arc')
    }
}
