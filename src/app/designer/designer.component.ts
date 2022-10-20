import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import * as PIXI from 'pixi.js';
import { SpriteReference } from './spriteReference';
import {v4 as uuidv4} from 'uuid';
import { Global} from './../globals'
import { ArrowReference } from './arrowReference';

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements AfterViewInit  {
    @ViewChild('divParent') div: ElementRef
    spriteReferenceList: SpriteReference[] = new Array()

    constructor(private ngZone: NgZone) {}

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
        // init application
        Global.app = new PIXI.Application({
            backgroundColor: 0x0d6efd
        });

        this.div.nativeElement.appendChild(Global.app.view)

        // load XML file
        let designerData = localStorage.getItem("designerData")
        if(designerData) this.loadSpritesFromLocal(designerData)
        else console.log("Local storage empty. Starting from scratch...")
        });
    }

    loadSpritesFromLocal(designerData: string){
        console.log("Restoring data from local storage")

        Global.xmlDoc = new DOMParser().parseFromString(designerData,"text/xml")

        // GENERATE OBJECTS
        const sprites = Global.xmlDoc.getElementsByTagName("objects")[0].getElementsByTagName("sprite")
        Array.from(sprites).forEach(sprite => {
            this.spriteReferenceList.push(new SpriteReference(
                sprite.getAttribute("id") as string, 
                false, 
                Number(sprite.getElementsByTagName("x")[0].textContent),
                Number(sprite.getElementsByTagName("y")[0].textContent),
                sprite.getElementsByTagName("text")[0].textContent as string,
                false
                ))
        })

        // GENERATE ARROWS
        this.spriteReferenceList.forEach(sr => {
            // if we have a pointTo reference we create arrows
            let targetId: Element
            if(targetId = Global.xmlDoc.querySelectorAll('[id="'+sr.id+'"] pointsTo')[0]) {
                let tmpArrow = new ArrowReference(sr.id, String(targetId.textContent), sr.sprite)
                sr.arrowReferenceList.push(tmpArrow)

                let targetRefs = this.spriteReferenceList.find(el => el.id == String(targetId.textContent))
                if(targetRefs) targetRefs.arrowReferenceList.push(tmpArrow)
                else console.warn("Could not find target id " + String(targetId.textContent) + " in XMLdoc.")
            }
        })
    }
  
    addObject(){
        new SpriteReference(uuidv4(), false, 10, 10, "Test", true)
    }

    destroy() {
        if(Global.app) Global.app.destroy()
        localStorage.setItem("designerData", new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
    }

    ngOnDestroy(): void {
        this.destroy()
    }
}
