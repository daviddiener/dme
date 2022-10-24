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
    canvas: ElementRef
    spriteReferenceList: SpriteReference[] = new Array()

    // mySubscription;

    constructor(private ngZone: NgZone) {}

    ngAfterViewInit(): void {
        this.ngZone.runOutsideAngular(() => {
        // init application
        Global.app = new PIXI.Application({
            backgroundColor: 0x0d6efd
        });

        this.div.nativeElement.innerHTML = ''
        this.div.nativeElement.appendChild(Global.app.view)

        // load XML file
        let designerData = localStorage.getItem("designerData")
        if(designerData) this.loadSpritesFromLocal(designerData)
        else this.createNewXMLDocument()
        });
    }

    loadSpritesFromLocal(designerData: string){
        console.log("Restoring data from local storage")

        Global.xmlDoc = new DOMParser().parseFromString(designerData,"text/xml")

        // GENERATE OBJECTS
        Array.from(Global.xmlDoc
            .getElementsByTagName("pnml")[0]
            .getElementsByTagName("net")[0]
            .getElementsByTagName("page")[0]
            .getElementsByTagName("place")).forEach(sprite => {
            this.spriteReferenceList.push(new SpriteReference(
                sprite.getAttribute("id") as string, 
                false, 
                Number(sprite
                    .getElementsByTagName("graphics")[0]
                    .getElementsByTagName("position")[0]
                    .getAttribute("x")),
                Number(sprite
                    .getElementsByTagName("graphics")[0]
                    .getElementsByTagName("position")[0]
                    .getAttribute("y")),
                sprite
                    .getElementsByTagName("name")[0]
                    .getElementsByTagName("text")[0]
                    .textContent as string,
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

    createNewXMLDocument(){
        console.log("Local storage empty. Starting from scratch...")
        Global.xmlDoc = document.implementation.createDocument(null, "pnml")

        const pnml = Global.xmlDoc.getElementsByTagName("pnml")[0]
        const net = pnml.appendChild(Global.xmlDoc.createElement("net"))
        net.appendChild(Global.xmlDoc.createElement("page"))
    }
  
    addObject(){
        new SpriteReference(uuidv4(), false, 10, 10, "Test", true)
    }

    deleteLocalStorage(){
        localStorage.clear()
        if(Global.app) Global.app.destroy()
        this.ngAfterViewInit()
    }

    ngOnDestroy(): void {
        if(Global.app) Global.app.destroy()
        localStorage.setItem("designerData", new XMLSerializer().serializeToString(Global.xmlDoc.documentElement))
    }
}
