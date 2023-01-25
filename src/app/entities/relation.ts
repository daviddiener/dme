import { Texture, Sprite, Graphics, Text, InteractionEvent } from 'pixi.js'
import { Global } from '../globals'
import { NodeEntity } from './nodeEntity'

export class Relation {
    public triangleTexture: Texture = Texture.from('assets/triangle.png')
    private parent: Sprite

    private line: Graphics
    private textBoxC1: Text
    private textBoxC2: Text

    constructor(
        public startNode: NodeEntity,
        public targetNode: NodeEntity,
        textValueC1: string,
        textValueC2: string,
        parent: Sprite,
    ) {
        this.startNode = startNode
        this.targetNode = targetNode
        this.parent = parent

        this.addArc()
        this.addTextBox(textValueC1, textValueC2)
        this.redraw()
    }

    addArc() {
        this.line = this.parent.addChild(new Graphics())
       
        // add it to the stage
        Global.app.stage.addChild(this.line)
    }

    addTextBox(c1: string, c2: string) {
        // add first cardinality
        this.textBoxC1 = new Text(c1, {
            fontFamily: 'Arial',
            fontSize: 22,
            align: 'center',
        })

        this.textBoxC1.resolution = 4
        this.textBoxC1.anchor.set(-3,0)

        Global.app.stage.addChild(this.textBoxC1)

        // add second cardinality
        this.textBoxC2 = new Text(c2, {
            fontFamily: 'Arial',
            fontSize: 22,
            align: 'center',
        })

        this.textBoxC2.resolution = 4
        this.textBoxC2.anchor.set(3,0)

        Global.app.stage.addChild(this.textBoxC2)
    }

    redraw() {
        this.line.clear()
        this.line.position.set(this.startNode.sprite.x + this.parent.width / 2, this.startNode.sprite.y)
        this.line
            .lineStyle(5, 0xffffff)
            .lineTo(this.targetNode.sprite.x - this.startNode.sprite.x - this.parent.width, this.targetNode.sprite.y - this.startNode.sprite.y)

        this.textBoxC1.position.set(
            this.startNode.sprite.x,
            this.startNode.sprite.y
        )

        this.textBoxC2.position.set(
            this.targetNode.sprite.x,
            this.targetNode.sprite.y
        )
    }
}
