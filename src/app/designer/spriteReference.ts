import * as PIXI from 'pixi.js';
import { InteractionEvent } from 'pixi.js';
import { ArrowReference } from './arrowReference';
import { Global} from './../globals'

export class SpriteReference {  
    public id: string  
    public sprite: PIXI.Sprite
    public arrowReferenceList: ArrowReference[] = new Array()

    private texture: PIXI.Texture = PIXI.Texture.WHITE
    private dragging: Boolean
    private textBox: PIXI.Text
    private data: any
    
    constructor(id: string, dragging: Boolean, x: number, y: number, textValue: string, saveInXml: boolean) {
        this.id = id
        this.dragging = dragging
        
        this.addSprite(x, y)
        this.addTextBox(textValue)

        if(saveInXml){
            // save sprite transform data in XML documenmt
            const parent = Global.xmlDoc
            .getElementsByTagName("pnml")[0]
            .getElementsByTagName("net")[0]
            .getElementsByTagName("page")[0]
            .appendChild(Global.xmlDoc.createElement("place"))

            parent.setAttribute("id", id)

            const graphics = parent.appendChild(Global.xmlDoc.createElement("graphics"))
            const position = graphics.appendChild(Global.xmlDoc.createElement("position"))

            position.setAttribute("x", x.toString())
            position.setAttribute("y", y.toString())

            const name = parent.appendChild(Global.xmlDoc.createElement("name"))
            const text = name.appendChild(Global.xmlDoc.createElement("text"))
            text.textContent = textValue
        }

    }

    addSprite(x: number, y: number) {
        this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        this.sprite = new PIXI.Sprite(this.texture);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        
        // center the anchor point and scale up
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(3);

        // set default position for sprite
        this.sprite.x = x;
        this.sprite.y = y;

        // setup events for mouse + touch using
        this.sprite
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));

        Global.app.stage.addChild(this.sprite);
    }

    addTextBox(text: string) {
        this.textBox = this.sprite.addChild(new PIXI.Text(text, {
            fontFamily : 'Arial',
            fontSize: 8,
            align : 'center',
        }));

        this.textBox.resolution = 4;
        this.textBox.anchor.set(0.5);
    }

    onDragStart (event: InteractionEvent) {
        event.target.alpha = 0.5;
        this.dragging = true;
        this.data = event.data;
    }
  
    onDragEnd(event: InteractionEvent) {
        event.target.alpha = 1;
        this.dragging = false;
        this.data = event.data;

        // save new position in XML document
        Global.xmlDoc.querySelectorAll('[id="'+this.id+'"] graphics position')[0].setAttribute("x", event.currentTarget.x.toString())
        Global.xmlDoc.querySelectorAll('[id="'+this.id+'"] graphics position')[0].setAttribute("y", event.currentTarget.y.toString())
    
        this.arrowReferenceList.forEach(arrowReference => {
            arrowReference.redrawArrow()
        })
    }
  
    onDragMove(event: InteractionEvent) {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(event.currentTarget.parent);
            event.currentTarget.x = newPosition.x;
            event.currentTarget.y = newPosition.y;
        }
    }
}