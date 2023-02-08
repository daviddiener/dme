import {
    InteractionData,
    InteractionEvent,
    Text,
    Texture,
    Sprite,
    SCALE_MODES,
} from 'pixi.js'
import { ArcReference as Arc } from './arcReference'
import { Global } from '../globals'
import { DesignerComponent } from '../designer/designer.component'
import { NodeType, XMLService } from 'src/app/services/xml.service'
import { Relation } from './relation'
import { getUUID } from '../services/helper.service'

export abstract class NodeEntity {
    public sprite: Sprite
    public arcList: Arc[]= []
    public relationList: Relation[]= []
    public promise: Promise<void>
    
    private textBox: Text
    private clickable = false
    private dragging = false
    private data: InteractionData

    constructor(
        public id: string,
        public x: number,
        public y: number,
        public textValue: string,
        public designerComponent: DesignerComponent | undefined,
        public xmlService: XMLService,
        public defaultTexture: Texture = Texture.EMPTY,
        isInteractive: boolean,
        tint: number,
        public savePositionOnDrag: boolean,
        public nodeType: NodeType
    ) {
        this.id = id
        this.textValue = textValue
        this.designerComponent = designerComponent
        this.xmlService = xmlService
        this.savePositionOnDrag = savePositionOnDrag

        // add PIXI.js objects
        this.addGraphicsObject(x, y, isInteractive, tint)
        this.addTextBox(textValue)
    }

    addGraphicsObject(x: number, y: number, isInteractive: boolean, tint: number) {
        this.defaultTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST
        this.sprite = new Sprite(this.defaultTexture)
        this.sprite.tint = tint

        if (this.sprite.texture.valid) {
            // resolve immediately
            this.promise = new Promise<void>((resolve) => {
                resolve()
            })
        } else {
            // wait for texture to be valid
            this.promise = new Promise<void>((resolve) => {
                this.sprite.texture.on('update', () => {
                    resolve()
                })
            })
        }

        this.sprite.interactive = isInteractive
        this.sprite.buttonMode = isInteractive

        // center the anchor point and scale up
        this.sprite.anchor.set(0.5)
        this.sprite.scale.set(0.1)

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
        this.textBox = this.sprite.addChild(
            new Text(text, {
                fontFamily: 'Arial',
                fontSize: 12,
                align: 'center',
            })
        )

        this.textBox.resolution = 1
        this.textBox.scale.set(10)
        this.textBox.anchor.set(0.5)
    }

    onDragStart(event: InteractionEvent) {
        event.target.alpha = 0.5
        this.dragging = true
        this.data = event.data
        this.clickable = true

        // Wait for 250 ms to register button click
        ;(async () => {
            await new Promise((resolve) => setTimeout(resolve, 250))
            this.clickable = false
        })()
    }

    onDragMove(event: InteractionEvent) {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(
                event.currentTarget.parent
            )
            event.currentTarget.x = newPosition.x
            event.currentTarget.y = newPosition.y
        }
    }

    onDragEnd(event: InteractionEvent) {
        event.currentTarget.alpha = 1
        this.dragging = false
        this.data = event.data

        // save new position in XML document
        if(this.savePositionOnDrag)
            this.xmlService.updateNodePosition(
                this.id,
                event.currentTarget.x,
                event.currentTarget.y
            )

        this.arcList.forEach((ar) => {
            ar.redraw()
        })
        this.relationList.forEach((ar) => {
            ar.redraw()
        })

        // handle node click if still clickable
        if (this.clickable && this.designerComponent) {
            if (this.designerComponent.createArcInProgress) {
                this.designerComponent.addArc(
                    getUUID(),
                    this.designerComponent.arcSourceNode.id,
                    this.id,
                    'a',
                    '1',
                    true
                )
            } else {
                this.designerComponent.activatePropertiesPanel(this)
            }
        }
    }

    public changeName(newName: string){
        this.textBox.text = newName
        this.xmlService.updateNodeName(this.id, newName)
    }
}
