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
        textValue: string,
        cardinality: string
    ) {
        const parent = Global.xmlDoc
            .getElementsByTagName('pnml')[0]
            .getElementsByTagName('net')[0]
            .getElementsByTagName('page')[0]
            .appendChild(Global.xmlDoc.createElement('arc'))

        parent.setAttribute('id', id)
        parent.setAttribute('source', startId)
        parent.setAttribute('target', targetId)

        const text1 = parent.appendChild(Global.xmlDoc.createElement('inscription'))
                            .appendChild(Global.xmlDoc.createElement('text'))
        text1.textContent = textValue

        const text2 = parent.appendChild(Global.xmlDoc.createElement('cardinality'))
                            .appendChild(Global.xmlDoc.createElement('text'))
        text2.textContent = cardinality

    }

    public updateArcCardinality(id: string, newCardinality: string) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] cardinality text')[0]
            .textContent = newCardinality        
    }


    public updateNodePosition(id: string, x: number, y: number) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('x', x.toString())
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] graphics position')[0]
            .setAttribute('y', y.toString())
    }

    public getNodeMarking(id: string): { name: string; type: string }[] {
        let data : { name: string; type: string }[] = []

        const marking = Global.xmlDoc.querySelectorAll('[id="' + id + '"] marking')

        if(marking.length > 0){
            Array.from(marking[0].getElementsByTagName('xs:element')).forEach(element => {
                data.push({"name": String(element.getAttribute('name')), "type": String(element.getAttribute('type'))})    
            });
        }

        return data
    }

    public getNodeMarkingDataObjectName(id: string | null): string {
        const marking = Global.xmlDoc.querySelectorAll('[id="' + id + '"] marking')
        if(marking.length > 0){
            return String(marking[0].getAttribute('name'))
        } else {
            return ''
        }
    }

    public updateNodeMarking(id: string, dataObjectName: string, data: { name: string; type: string }[]) {
        const node = Global.xmlDoc.querySelectorAll('[id="' + id + '"]')        
        let marking: Element

        if(node[0].getElementsByTagName('marking').length > 0){ 
            node[0].removeChild(node[0].getElementsByTagName('marking')[0])           
        }

        // create marking tag again
        marking = node[0].appendChild(Global.xmlDoc.createElement('marking'))
        marking.setAttribute('xmlns:xs', "http://www.w3.org/2001/XMLSchema")
        marking.setAttribute('name', dataObjectName)

        data.forEach(element => {
            let tmp = marking.appendChild(Global.xmlDoc.createElement('xs:element'))
            tmp.setAttribute("name", element.name)
            tmp.setAttribute("type", element.type)
        });

        return data
    }

    public updateNodeName(id: string, newName: string) {
        Global.xmlDoc
            .querySelectorAll('[id="' + id + '"] name text')[0]
            .textContent = newName        
    }

    public getNodeName(id: string|null) : string {
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

    public getDistinctOwners() : any[]{

        const tmp = new Array();
        Global.xmlDoc.querySelectorAll('owner text').forEach(element => {
            tmp.push(element.textContent)
        })
                
        let uniqueItems = [...new Set(tmp)]
        return uniqueItems
    }

    public getDistinctMarkings(){
        const tmp = new Array();
        Global.xmlDoc.querySelectorAll('marking').forEach(element => {
            tmp.push(element.getAttribute('name'))
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

    public getNodeIdByName(name: string): any {
        let id = null
        Array.from(Global.xmlDoc
            .querySelectorAll('place')).forEach(element =>{ 
            if(element
                .getElementsByTagName('name')[0]
                .getElementsByTagName('text')[0].textContent == name) {
                    id = element.getAttribute('id')
                }
                
        })

        return id
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

    public getAllArcsWithSource(id: string|null): NodeListOf<Element> {
        return Global.xmlDoc.querySelectorAll('[source="' + id + '"]')
    }

    public getAllArcsWithTarget(id: string|null): NodeListOf<Element> {
        return Global.xmlDoc.querySelectorAll('[target="' + id + '"]')
    }
}
