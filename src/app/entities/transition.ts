import { Node, NodeType } from './node'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLNodeService } from '../services/xml.node.service'

export class Transition extends Node {
    constructor(
        id: string,
        x: number,
        y: number,
        textValue: string,
        saveInXml: boolean,
        designerComponent: DesignerComponent | undefined,
        xmlNodeService: XMLNodeService
    ) {
        super(
            id,
            x,
            y,
            textValue,
            designerComponent,
            xmlNodeService,
            Texture.from('assets/transition.png'),
            true,
            0xffffff,
            true,
            NodeType.transition
        )

        // save object in global XML
        if (saveInXml) xmlNodeService.createNode(id, x, y, textValue, NodeType.transition)
    }
}
