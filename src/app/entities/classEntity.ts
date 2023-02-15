import { NodeEntity, NodeType } from './nodeEntity'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLNodeService } from '../services/xml.node.service'

export class ClassEntity extends NodeEntity {
    constructor(
        id: string,
        x: number,
        y: number,
        textValue: string,
        designerComponent: DesignerComponent | undefined,
        xmlNodeService: XMLNodeService,
        tint: number
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
            tint,
            false,
            NodeType.class
        )
    }
}
