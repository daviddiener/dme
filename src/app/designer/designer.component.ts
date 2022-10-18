import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import * as PIXI from 'pixi.js';
import { InteractionEvent } from 'pixi.js';
import { SpriteReference } from './spriteReference';
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements AfterViewInit  {
  public app?: PIXI.Application;
  public texture: PIXI.Texture = PIXI.Texture.WHITE;
  public xmlDoc: XMLDocument = document.implementation.createDocument(null, "objects");
  @ViewChild('divParent') div: ElementRef;

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      // init application
      this.app = new PIXI.Application({
        backgroundColor: 0x0d6efd
      });
      // this.elementRef.nativeElement.appendChild(this.app.view);
      this.div.nativeElement.appendChild(this.app.view);
      this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      // load XML file
      // TODO: implement
      let designerData = localStorage.getItem("designerData");
      if(designerData) this.loadSpritesFromLocal(designerData);
      else this.initSpriteGeneration();
    });
  }

  loadSpritesFromLocal(designerData: string){
    console.log("Restoring data from local storage");

    this.xmlDoc = new DOMParser().parseFromString(designerData,"text/xml");

    const sprites = this.xmlDoc.getElementsByTagName("objects")[0].getElementsByTagName("sprite");
    Array.from(sprites).forEach(sprite => {
      this.createSprite(
        sprite.getAttribute("id") as string,
        Number(sprite.getElementsByTagName("x")[0].textContent),
        Number(sprite.getElementsByTagName("y")[0].textContent)
        );
    });  
  }
  
  initSpriteGeneration(){
    console.log("Local storage empty. Starting from scratch...");
    if(this.app){
      // Debug create random batch sprites
      for (let i = 0; i < 10; i++) {
        this.createSprite(
            uuidv4(),
            Math.floor(Math.random() * this.app.screen.width),
            Math.floor(Math.random() * this.app.screen.height),
        );
      }
    }
  }

  createSprite(id: string, x: number, y: number, saveInXMLDoc: boolean = false) {
      
      const sr = new SpriteReference(id, new PIXI.Sprite(this.texture), false);
      const sprite = new PIXI.Sprite(this.texture);
      sprite.interactive = true;
      sprite.buttonMode = true;
  
      // center the anchor point and scale up
      sprite.anchor.set(0.5);
      sprite.scale.set(3);
  
      // set default position and uuid for sprite
      sprite.x = x;
      sprite.y = y;

      const text = sprite.addChild(new PIXI.Text('Test', {
              fontFamily : 'Arial',
              fontSize: 8,
              align : 'center',
            }
            ))

      text.resolution = 4;
      text.anchor.set(0.5);

      // setup events for mouse + touch using
      sprite
          .on('pointerdown', this.onDragStart.bind(this, sr))
          .on('pointerup', this.onDragEnd.bind(this, sr))
          .on('pointermove', this.onDragMove.bind(this, sr));

      // save sprite transform data in XML documenmt
      if(saveInXMLDoc){
        let el = this.xmlDoc.getElementsByTagName("objects")[0].appendChild(this.xmlDoc.createElement("sprite"))
        el.setAttribute("id", id)
        el.appendChild(this.xmlDoc.createElement("x")).textContent = x.toString();
        el.appendChild(this.xmlDoc.createElement("y")).textContent = y.toString();  
      }
      
      // add it to the stage
      if(this.app) this.app.stage.addChild(sprite);
  }
  
  onDragStart (sr: SpriteReference, event: InteractionEvent) {
    event.target.alpha = 0.5;
    sr.dragging = true;
    sr.data = event.data;
  }
  
  onDragEnd(sr: SpriteReference, event: InteractionEvent) {
    event.target.alpha = 1;
    sr.dragging = false;
    sr.data = event.data;

    // save new position in XML document
    this.xmlDoc.querySelectorAll('[id="'+sr.id+'"] x')[0].textContent = event.currentTarget.x.toString();
    this.xmlDoc.querySelectorAll('[id="'+sr.id+'"] y')[0].textContent = event.currentTarget.y.toString();
  }
  
  onDragMove(sr: SpriteReference, event: InteractionEvent) {
    if (sr.dragging) {
      const newPosition = sr.data.getLocalPosition(event.currentTarget.parent);
      event.currentTarget.x = newPosition.x;
      event.currentTarget.y = newPosition.y;
    }
  }

  addObject(){
    this.createSprite(uuidv4(), 10, 10, true);
  }

  destroy() {
    if(this.app) this.app.destroy();
    localStorage.setItem("designerData", new XMLSerializer().serializeToString(this.xmlDoc.documentElement));
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
