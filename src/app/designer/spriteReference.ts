import * as PIXI from 'pixi.js';

export class SpriteReference {
    id: string;
    sprite: PIXI.Sprite;
    dragging: Boolean;
    data: any;
   
    constructor(id: string, sprite: PIXI.Sprite, dragging: Boolean) {
      this.id = id;
      this.sprite = sprite;
      this.dragging = dragging;
    }
  }