import { Node, NodeType } from './node'
import { Texture } from 'pixi.js'
import { DesignerComponent } from '../designer/designer.component'
import { XMLNodeService } from '../services/xml.node.service'
import { XMLPlaceService } from '../services/xml.place.service';

export class Place extends Node {
    constructor(
        id: string,
        x: number,
        y: number,
        textValue: string,
        saveInXml: boolean,
        designerComponent: DesignerComponent | undefined,
        xmlNodeService: XMLNodeService,
        public tokenSchemaName: string | undefined = undefined,
        public tokenSchema: { name: string; type: string, isPrimaryKey: boolean }[] | undefined = undefined,
        public superClassName: string[] | undefined = undefined,
    ) {
        super(
            id,
            x,
            y,
            textValue,
            designerComponent,
            xmlNodeService,
            Texture.from('assets/place.png'),
            true,
            0xffffff,
            true,
            NodeType.place
        )

        // save object in global XML
        if (saveInXml) xmlNodeService.createNode(id, x, y, textValue, NodeType.place)
    }

    public updatePlaceTokenSchema(dataObjectName: string, data: { name: string; type: string, isPrimaryKey: boolean }[], superClassName: string[], xmlPlaceService: XMLPlaceService){
        this.tokenSchemaName = dataObjectName
        this.tokenSchema = data
        this.superClassName = superClassName
        xmlPlaceService.updatePlaceTokenSchema(this.id, dataObjectName, data, superClassName)
    }
}
