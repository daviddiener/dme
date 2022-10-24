import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import * as PIXI from 'pixi.js';
import { PlaceReference as PlaceReference } from './placeReference';
import {v4 as uuidv4} from 'uuid';
import { Global} from './../globals'
import { ArcReference } from './arcReference';

@Component({
    selector: 'app-designer',
    templateUrl: './designer.component.html',
    styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements AfterViewInit  {
    @ViewChild('divParent') div: ElementRef
    canvas: ElementRef
    placeReferenceList: PlaceReference[] = new Array()

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
        if(designerData) this.loadDataFromLocal(designerData)
        else this.createNewXMLDocument()
        });
    }

    loadDataFromLocal(designerData: string){
        console.log("Restoring data from local storage")

        Global.xmlDoc = new DOMParser().parseFromString(designerData,"text/xml")

        // GENERATE PLACES
        Array.from(Global.xmlDoc
            .getElementsByTagName("pnml")[0]
            .getElementsByTagName("net")[0]
            .getElementsByTagName("page")[0]
            .getElementsByTagName("place")).forEach(place => {
            this.placeReferenceList.push(new PlaceReference(
                place.getAttribute("id") as string, 
                false, 
                Number(place
                    .getElementsByTagName("graphics")[0]
                    .getElementsByTagName("position")[0]
                    .getAttribute("x")),
                Number(place
                    .getElementsByTagName("graphics")[0]
                    .getElementsByTagName("position")[0]
                    .getAttribute("y")),
                place
                    .getElementsByTagName("name")[0]
                    .getElementsByTagName("text")[0]
                    .textContent as string,
                false
                ))
        })

        // GENERATE ARCS
        Array.from(Global.xmlDoc
            .getElementsByTagName("pnml")[0]
            .getElementsByTagName("net")[0]
            .getElementsByTagName("page")[0]
            .getElementsByTagName("arc")).forEach(arc => {
                let tmpArc;
                let sourceRef = this.placeReferenceList.find(el => el.id == String(arc.getAttribute("source")))
                if(sourceRef) {
                    tmpArc = new ArcReference(String(arc.getAttribute("source")), String(arc.getAttribute("target")), sourceRef.sprite)
                    sourceRef.arcReferenceList.push(tmpArc)
                }

                let targetRef = this.placeReferenceList.find(el => el.id == String(arc.getAttribute("target")))
                if(targetRef && tmpArc) targetRef.arcReferenceList.push(tmpArc)
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
        new PlaceReference(uuidv4(), false, 30, 30, "Test", true)
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
