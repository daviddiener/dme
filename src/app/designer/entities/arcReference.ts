import * as PIXI from 'pixi.js';
import { Global} from '../../globals'

export class ArcReference {
    public triangleTexture: PIXI.Texture = PIXI.Texture.from('assets/triangle.png');
    public id: string  
    private startId: string
    private targetId: string
    private parent: PIXI.Sprite

    private line: PIXI.Graphics
    private triangleSrite: PIXI.Sprite
    private textBox: PIXI.Text

    constructor(id: string, startId: string, targetId: string, textValue: string, parent: PIXI.Sprite, saveInXml: boolean){
        this.id = id
        this.startId = startId
        this.targetId = targetId
        this.parent = parent

        this.addArc()
        this.addTextBox(textValue)
        this.redrawArc()

        if(saveInXml){
            // save arc data in XML documenmt
            const parent = Global.xmlDoc
            .getElementsByTagName("pnml")[0]
            .getElementsByTagName("net")[0]
            .getElementsByTagName("page")[0]
            .appendChild(Global.xmlDoc.createElement("arc"))

            parent.setAttribute("id", this.id)
            parent.setAttribute("source", this.startId)
            parent.setAttribute("target", this.targetId)

            const inscription = parent.appendChild(Global.xmlDoc.createElement("inscription"))
            const text = inscription.appendChild(Global.xmlDoc.createElement("text"))
            text.textContent = textValue
        }
    }

    addArc() {
        this.line = this.parent.addChild(new PIXI.Graphics())
        this.triangleSrite = this.line.addChild(new PIXI.Sprite(this.triangleTexture))
        this.triangleSrite.scale.set(0.05)
        this.triangleSrite.anchor.set(0.75, 0.5)
        
        // add it to the stage
        Global.app.stage.addChild(this.line)        
    }

    addTextBox(text: string) {
        this.textBox = new PIXI.Text(text, {
            fontFamily : 'Arial',
            fontSize: 22,
            align : 'center',
        })

        this.textBox.resolution = 4
        this.textBox.anchor.set(0.5)

        Global.app.stage.addChild(this.textBox)        
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
        this.textBox.position.set((endX + startX) / 2, (endY + startY) / 2)
    }
}
