import { Injectable } from '@angular/core'
import { Global } from './../globals'

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

    public createNode(id: string, x: number, y: number, textValue: string) {
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement('place'))

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

    public getAllNodes(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('place')
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
