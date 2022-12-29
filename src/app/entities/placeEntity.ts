import { NodeEntity } from './nodeEntity'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLService, NodeType } from 'src/app/services/xml.service'

export class PlaceEntity extends NodeEntity {
    constructor(
        id: string,
        dragging: boolean,
        x: number,
        y: number,
        textValue: string,
        saveInXml: boolean,
        designerComponent: DesignerComponent,
        xmlService: XMLService
    ) {
        super(
            id,
            dragging,
            x,
            y,
            textValue,
            saveInXml,
            designerComponent,
            xmlService,
            Texture.from('assets/place.png')
        )

        // save object in global XML
        if (saveInXml)
            xmlService.createNode(id, x, y, textValue, NodeType.place)
    }
}
