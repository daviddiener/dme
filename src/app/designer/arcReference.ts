import * as PIXI from 'pixi.js';
import { Global} from '../globals'

export class ArcReference {
    public triangleTexture: PIXI.Texture = PIXI.Texture.from('assets/triangle.png');

    startId: string
    targetId: string
    parent: PIXI.Sprite

    line: PIXI.Graphics
    triangleSrite: PIXI.Sprite

    constructor(startId: string, targetId: string, parent: PIXI.Sprite){
        this.startId = startId
        this.targetId = targetId
        this.parent = parent

        this.addArc()
    }

    addArc() {
        this.line = this.parent.addChild(new PIXI.Graphics())
        this.triangleSrite = this.line.addChild(new PIXI.Sprite(this.triangleTexture))
        this.triangleSrite.scale.set(0.05)
        this.triangleSrite.anchor.set(0.75, 0.5)

        this.redrawArc()
        
        // add it to the stage
        Global.app.stage.addChild(this.line)        
    }
    
    redrawArc(){
        const startX = Number(Global.xmlDoc.querySelectorAll('[id="'+this.startId+'"] graphics position')[0].getAttribute("x"))
        const startY = Number(Global.xmlDoc.querySelectorAll('[id="'+this.startId+'"] graphics position')[0].getAttribute("y"))

        const endX = Number(Global.xmlDoc.querySelectorAll('[id="'+this.targetId+'"] graphics position')[0].getAttribute("x"))
        const endY = Number(Global.xmlDoc.querySelectorAll('[id="'+this.targetId+'"] graphics position')[0].getAttribute("y"))

        this.line.clear()
        this.line.position.set(startX + this.parent.width / 2, startY)
        this.line.lineStyle(5, 0xffffff)
        .lineTo(endX - startX  - this.parent.width, endY - startY)

        this.triangleSrite.position.set(endX - startX - this.parent.width, endY - startY)
    }
}
