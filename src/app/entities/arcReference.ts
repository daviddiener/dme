import { Texture, Sprite, Graphics, Text, InteractionEvent } from 'pixi.js'
import { XMLService } from 'src/app/services/xml.service'
import { Global } from '../globals'

export class ArcReference {
    public triangleTexture: Texture = Texture.from('assets/triangle.png')
    public id: string
    private startId: string
    private targetId: string
    private parent: Sprite
    private xmlService: XMLService

    private line: Graphics
    private triangleSrite: Sprite
    private textBox: Text

    constructor(
        id: string,
        startId: string,
        targetId: string,
        textValue: string,
        cardinality: string,
        parent: Sprite,
        saveInXml: boolean,
        xmlService: XMLService
    ) {
        this.id = id
        this.startId = startId
        this.targetId = targetId
        this.parent = parent
        this.xmlService = xmlService

        this.addArc()
        this.addTextBox(cardinality)
        this.redraw()

        if (saveInXml)
            this.xmlService.createArc(id, startId, targetId, textValue, cardinality)
    }

    addArc() {
        this.line = this.parent.addChild(new Graphics())
        this.triangleSrite = this.line.addChild(
            new Sprite(this.triangleTexture)
        )
        this.triangleSrite.scale.set(0.05)
        this.triangleSrite.anchor.set(0.75, 0.5)

        // add it to the stage
        Global.app.stage.addChild(this.line)
    }

    addTextBox(text: string) {
        this.textBox = new Text(text, {
            fontFamily: 'Arial',
            fontSize: 22,
            align: 'center',
        })

        this.textBox.resolution = 4
        this.textBox.anchor.set(0.5)
        
        this.textBox.interactive = true
        this.textBox.buttonMode = true

        // setup events for mouse + touch using
        this.textBox.on('pointerdown', this.onClick.bind(this))

        Global.app.stage.addChild(this.textBox)
    }

    redraw() {
        const start = this.xmlService.getNodePosition(this.startId)
        const end = this.xmlService.getNodePosition(this.targetId)

        this.line.clear()
        this.line.position.set(start[0] + this.parent.width / 2, start[1])
        this.line
            .lineStyle(5, 0xffffff)
            .lineTo(end[0] - start[0] - this.parent.width, end[1] - start[1])

        this.triangleSrite.position.set(
            end[0] - start[0] - this.parent.width,
            end[1] - start[1]
        )
        this.textBox.position.set(
            (end[0] + start[0]) / 2,
            (end[1] + start[1]) / 2
        )
    }

    onClick(event: InteractionEvent) {
        const text = event.target as Text

        if(text.text == '1') {
            text.text = '*'
            this.xmlService.updateArcCardinality(this.id, '*')
        }
        else {
            text.text = '1'
            this.xmlService.updateArcCardinality(this.id, '1')
        }
    }
}
