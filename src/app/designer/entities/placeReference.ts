import * as PIXI from 'pixi.js'
import { InteractionEvent } from 'pixi.js'
import { ArcReference } from './arcReference'
import { Global} from '../../globals'
import { DesignerComponent } from '../designer.component';
import {v4 as uuidv4} from 'uuid';
import { XMLService } from 'src/app/services/xml.service';

export class PlaceReference {  
    public id: string  
    public sprite: PIXI.Sprite
    public arcReferenceList: ArcReference[] = new Array()

    private designerComponent: DesignerComponent
    public xmlService: XMLService
    private defaultTexture: PIXI.Texture = PIXI.Texture.WHITE
    private dragging: Boolean
    private clickable: Boolean = false
    private textBox: PIXI.Text
    private data: any
    
    constructor(id: string, dragging: Boolean, x: number, y: number, textValue: string, saveInXml: boolean, designerComponent: DesignerComponent, xmlService: XMLService) {
        this.id = id
        this.dragging = dragging
        this.designerComponent = designerComponent
        this.xmlService = xmlService

        // add PIXI.js objects
        this.addPlace(x, y)
        this.addTextBox(textValue)

        // save object in global XML
        if(saveInXml) xmlService.createNode(id, x, y, textValue)

    }

    addPlace(x: number, y: number) {
        this.defaultTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST

        this.sprite = new PIXI.Sprite(this.defaultTexture)
        this.sprite.interactive = true
        this.sprite.buttonMode = true
        
        // center the anchor point and scale up
        this.sprite.anchor.set(0.5)
        this.sprite.scale.set(3)

        // set default position for sprite
        this.sprite.x = x
        this.sprite.y = y

        // setup events for mouse + touch using
        this.sprite
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointermove', this.onDragMove.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))

        Global.app.stage.addChild(this.sprite)
    }

    addTextBox(text: string) {
        this.textBox = this.sprite.addChild(new PIXI.Text(text, {
            fontFamily : 'Arial',
            fontSize: 8,
            align : 'center',
        }))

        this.textBox.resolution = 4
        this.textBox.anchor.set(0.5)
    }

    onDragStart (event: InteractionEvent) {
        event.target.alpha = 0.5
        this.dragging = true
        this.data = event.data
        this.clickable = true;

        // Wait for 80 ms to register button click
        (async () => {     
            await this.delay(80);
            this.clickable = false
        })()

    }

    onDragMove(event: InteractionEvent) {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(event.currentTarget.parent)
            event.currentTarget.x = newPosition.x
            event.currentTarget.y = newPosition.y
        }
    }

    delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
  
    onDragEnd(event: InteractionEvent) {
        event.currentTarget.alpha = 1
        this.dragging = false
        this.data = event.data

        // save new position in XML document
        this.xmlService.updateNodePosition(this.id, event.currentTarget.x, event.currentTarget.y)
    
        this.arcReferenceList.forEach(ar => {
            ar.redrawArc()
        })

        // handle node click if still clickable
        if(this.clickable) {
            if(this.designerComponent.createArcInProgress) {
                this.designerComponent.addArc(uuidv4(), this.designerComponent.arcSourceNode.id, this.id, "testArc", true)
            } else {
                this.designerComponent.activateCreateArcBtn(this)
            }
        }
    }
}