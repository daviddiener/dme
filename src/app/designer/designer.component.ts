import { OnInit, Component, ElementRef, NgZone } from '@angular/core';
import * as PIXI from 'pixi.js';
import { InteractionData, InteractionEvent } from 'pixi.js';

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements OnInit {
  public app?: PIXI.Application = undefined;
  public texture: PIXI.Texture = PIXI.Texture.WHITE;
  public data?: InteractionData = undefined;
  public alpha: any;
  public dragging: any;

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.app = new PIXI.Application({backgroundColor: 0x1099bb});
      this.elementRef.nativeElement.appendChild(this.app.view);

      this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      for (let i = 0; i < 10; i++) {
        this.createSprite(
            Math.floor(Math.random() * this.app.screen.width),
            Math.floor(Math.random() * this.app.screen.height),
        );
      }
    });
  }
  
  createSprite(x: number, y: number) {
      // create our little bunny friend..
      const sprite = new PIXI.Sprite(this.texture);
  
      // enable the sprite to be interactive... this will allow it to respond to mouse and touch events
      sprite.interactive = true;
  
      // this button mode will mean the hand cursor appears when you roll over the sprite with your mouse
      sprite.buttonMode = true;
  
      // center the anchor point
      sprite.anchor.set(0.5);
  
      // make it a bit bigger, so it's easier to grab
      sprite.scale.set(3);
  
      // setup events for mouse + touch using
      // the pointer events
      sprite
          .on('pointerdown', this.onDragStart)
          .on('pointerup', this.onDragEnd)
          .on('pointerupoutside', this.onDragEnd)
          .on('pointermove', this.onDragMove);
  
      // For mouse-only events
      // .on('mousedown', onDragStart)
      // .on('mouseup', onDragEnd)
      // .on('mouseupoutside', onDragEnd)
      // .on('mousemove', onDragMove);
  
      // For touch-only events
      // .on('touchstart', onDragStart)
      // .on('touchend', onDragEnd)
      // .on('touchendoutside', onDragEnd)
      // .on('touchmove', onDragMove);
  
      // move the sprite to its designated position
      sprite.x = x;
      sprite.y = y;
  
      // add it to the stage
      if(this.app) this.app.stage.addChild(sprite);
  }
  
  onDragStart(event: any) {
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      this.data = event.data;
      this.alpha = 0.5;
      this.dragging = true;
  }
  
  onDragEnd() {
      this.alpha = 1;
      this.dragging = false;
      // set the interaction data to null
      this.data = undefined;
  }
  
  onDragMove(evt: InteractionEvent) {
      if (this.dragging) {
          let newPosition = undefined;
          if(this.data) { 
            newPosition = this.data.getLocalPosition(evt.currentTarget.parent);
            evt.currentTarget.x = newPosition.x;
            evt.currentTarget.y = newPosition.y;
          }
      }

  }

  destroy() {
    if(this.app) this.app.destroy();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
