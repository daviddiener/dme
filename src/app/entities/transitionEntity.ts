import { NodeEntity } from './nodeEntity'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLService, NodeType } from 'src/app/services/xml.service'

export class TransitionEntity extends NodeEntity {
    constructor(
        id: string,
        x: number,
        y: number,
        textValue: string,
        saveInXml: boolean,
        designerComponent: DesignerComponent | undefined,
        xmlService: XMLService
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
            0xFFFFFF,
            true
        )

        // save object in global XML
        if (saveInXml)
            xmlService.createNode(id, x, y, textValue, NodeType.transition)
    }
}
