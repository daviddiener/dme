import { Viewport } from 'pixi-viewport'
import { v4 as uuidv4 } from 'uuid'
import { Global } from '../globals'
import * as PIXI from 'pixi.js'

export function getUUID(): string {
    // this function makes sure that the first letter of the UUID is a small letter for PNML specification
    return String.fromCharCode(97 + Math.floor(Math.random() * 26)) + uuidv4()
}

export function initializePixiApplication() {
    // init application
    Global.app = new PIXI.Application({
        backgroundColor: 0x0d6efd,
    })

    // create viewport
    Global.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,
        // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        interaction: Global.app.renderer.plugins['interaction'],
    })

    // add the viewport to the stage
    Global.app.stage.addChild(Global.viewport)

    // activate plugins
    Global.viewport.drag().pinch().wheel()
}
