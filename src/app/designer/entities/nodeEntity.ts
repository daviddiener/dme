import {
    InteractionData,
    InteractionEvent,
    Text,
    Texture,
    Sprite,
    SCALE_MODES,
} from 'pixi.js'
import { ArcReference } from './arcReference'
import { Global } from '../../globals'
import { DesignerComponent } from '../designer.component'
import { v4 as uuidv4 } from 'uuid'
import { XMLService } from 'src/app/services/xml.service'

export abstract class NodeEntity {
    public sprite: Sprite
    public arcReferenceList: ArcReference[] = []
    public promise: Promise<void>

    private clickable = false
    private textBox: Text
    private data: InteractionData

    constructor(
        public id: string,
        private dragging: boolean,
        x: number,
        y: number,
        textValue: string,
        _saveInXml: boolean,
        private designerComponent: DesignerComponent,
        public xmlService: XMLService,
        public defaultTexture: Texture = Texture.EMPTY
    ) {
        this.id = id
        this.dragging = dragging
        this.designerComponent = designerComponent
        this.xmlService = xmlService

        // add PIXI.js objects
        this.addGraphicsObject(x, y)
        this.addTextBox(textValue)
    }

    addGraphicsObject(x: number, y: number) {
        this.defaultTexture.baseTexture.scaleMode = SCALE_MODES.NEAREST
        this.sprite = new Sprite(this.defaultTexture)

        if(this.sprite.texture.valid) {
            // resolve immediately
            this.promise = new Promise<void>((resolve) => { resolve() })
        } else {
            // wait for texture to be valid
            this.promise = new Promise<void>((resolve) => { 
                this.sprite.texture.on('update', () => {
                    resolve() 
                }) 
            })
        }
        
        this.sprite.interactive = true
        this.sprite.buttonMode = true

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

        // Wait for 80 ms to register button click
        ;(async () => {
            await new Promise((resolve) => setTimeout(resolve, 80))
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
        this.xmlService.updateNodePosition(
            this.id,
            event.currentTarget.x,
            event.currentTarget.y
        )

        this.arcReferenceList.forEach((ar) => {
            ar.redrawArc()
        })

        // handle node click if still clickable
        if (this.clickable) {
            if (this.designerComponent.createArcInProgress) {
                this.designerComponent.addArc(
                    uuidv4(),
                    this.designerComponent.arcSourceNode.id,
                    this.id,
                    'testArc',
                    true
                )
            } else {
                this.designerComponent.activateCreateArcBtn(this)
            }
        }
    }
}