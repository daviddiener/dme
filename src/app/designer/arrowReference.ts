import * as PIXI from 'pixi.js';
import { Global} from './../globals'

export class ArrowReference {
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

        this.addArrows()
    }

    addArrows() {
        this.line = this.parent.addChild(new PIXI.Graphics())
        this.triangleSrite = this.line.addChild(new PIXI.Sprite(this.triangleTexture))

        this.redrawArrow()
        
        // add it to the stage
        Global.app.stage.addChild(this.line)        
    }
    
    redrawArrow(){
        const startX = Number(Global.xmlDoc.querySelectorAll('[id="'+this.startId+'"] x')[0].textContent)
        const startY = Number(Global.xmlDoc.querySelectorAll('[id="'+this.startId+'"] y')[0].textContent)

        const endX = Number(Global.xmlDoc.querySelectorAll('[id="'+this.targetId+'"] x')[0].textContent)
        const endY = Number(Global.xmlDoc.querySelectorAll('[id="'+this.targetId+'"] y')[0].textContent)

        this.line.clear()

        this.line.position.set(startX, startY)
        this.line.lineStyle(3, 0xffffff)
        .lineTo(endX - startX, endY - startY)

        this.triangleSrite.position.set(endX - startX, endY - startY);
        this.triangleSrite.scale.set(0.05)
        this.triangleSrite.anchor.set(0.5)
    }
}
