import { Global } from './../globals'
import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class XMLArcService {
    /**
     * Creates a new arc object in the XML document.
     * @param id a UUID
     * @param startId a UUID that references the source node of this arc
     * @param targetId a UUID that references the rarget node of this arc
     * @param textValue the inscription text
     * @param cardinality the cardinality between the source and target nodes
     */
    public createArc(id: string, startId: string, targetId: string, textValue: string, cardinality: string) {
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement('arc'))

        parent.setAttribute('id', id)
        parent.setAttribute('source', startId)
        parent.setAttribute('target', targetId)

        const text1 = parent
            .appendChild(Global.xmlDoc.createElement('inscription'))
            .appendChild(Global.xmlDoc.createElement('text'))
        text1.textContent = textValue

        const text2 = parent.appendChild(Global.xmlDoc.createElement('hlinscription'))
        text2.textContent = cardinality
    }

    /**
     * Updates the cardinality of an arc object in the XML document.
     * @param id
     * @param newCardinality
     */
    public updateArcCardinality(id: string, newCardinality: string) {
        Global.xmlDoc.querySelectorAll('[id="' + id + '"] hlinscription')[0].textContent = newCardinality
    }

    /**
     * Returns all arcs defined in the XML document.
     * @returns A collection of the xml elements
     */
    public getAllArcs(): HTMLCollectionOf<Element> {
        return Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .getElementsByTagName('arc')
    }

    /**
     * Returns all arcs, which source node equals the provided id.
     * @param id
     * @returns A list of xml elements
     */
    public getAllArcsWithSource(id: string | null): NodeListOf<Element> {
        return Global.xmlDoc.querySelectorAll('[source="' + id + '"]')
    }

    /**
     * Returns all arcs, which target node equals the provided id.
     * @param id
     * @returns A list of xml elements
     */
    public getAllArcsWithTarget(id: string | null): NodeListOf<Element> {
        return Global.xmlDoc.querySelectorAll('[target="' + id + '"]')
    }
}
