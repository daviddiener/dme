import { NodeEntity, NodeType } from './nodeEntity'
import { Texture, Text } from 'pixi.js'
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

    lastAttributeTextPositionY = 500

    public addAttributeGrahpicsObject(attributeName: string){
        const textBox = this.sprite.addChild(
            new Text(attributeName, {
                fontFamily: 'Arial',
                fontSize: 12,
                align: 'center',
            })
        )

        textBox.position.y = this.lastAttributeTextPositionY
        this.lastAttributeTextPositionY += 200

        textBox.resolution = 1
        textBox.scale.set(10)
        textBox.anchor.set(0.5)
    }

}
