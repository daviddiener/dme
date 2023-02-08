import { NodeEntity } from './nodeEntity'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLService, NodeType } from 'src/app/services/xml.service'

export class ClassEntity extends NodeEntity {
    constructor(
        id: string,
        x: number,
        y: number,
        textValue: string,
        designerComponent: DesignerComponent | undefined,
        xmlService: XMLService,
        tint: number
    ) {
        super(
            id,
            x,
            y,
            textValue,
            designerComponent,
            xmlService,
            Texture.from('assets/transition.png'),
            true,
            tint,
            false,
            NodeType.class
        )

    }
}
