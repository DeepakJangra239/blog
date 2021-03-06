import {Component, ViewChild} from '@angular/core';
import {DrawableDirective} from '../drawable.directive';
import * as math from 'mathjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild(DrawableDirective) drawable: DrawableDirective;
  detections: number[] = [];
  detectedNumber: number;
  private weightsInputHidden: number[][];
  private weightsHiddenOutput: number[][];

  constructor() {
    const fetchInputHidden = fetch('assets/weights-input-hidden.json');
    const fetchHiddenOutput = fetch('assets/weights-hidden-output.json');

    fetchInputHidden.then(response => response.json()).then(json => {
      this.weightsInputHidden = json;
    });
    fetchHiddenOutput.then(response => response.json()).then(json => {
      this.weightsHiddenOutput = json;
    });
  }

  sigmoid(t) {
    return 1 / (1 + Math.exp(-t));
  }

  detect(canvas) {
    const canvasCopy = document.createElement('canvas');
    canvasCopy.width = 28;
    canvasCopy.height = 28;

    const copyContext = canvasCopy.getContext('2d');

    const ratioX = canvas.width / 28;
    const ratioY = canvas.height / 28;
    const drawBox = this.drawable.getDrawingBox();
    const scaledSourceWidth = Math.min(20, Math.max(4, ((drawBox[2] - drawBox[0] + 32) / ratioX)));
    const scaledSourceHeight = Math.min(20, ((drawBox[3] - drawBox[1] + 32) / ratioY));
    const dx = (28 - scaledSourceWidth) / 2;
    const dy = (28 - scaledSourceHeight) / 2;

    copyContext.drawImage(canvas, drawBox[0] - 16, drawBox[1] - 16, drawBox[2] - drawBox[0] + 16, drawBox[3] - drawBox[1] + 16,
      dx, dy, scaledSourceWidth, scaledSourceHeight);
    const imageData = copyContext.getImageData(0, 0, 28, 28);

    const numPixels = imageData.width * imageData.height;
    const values = new Array<number>(numPixels);
    for (let i = 0; i < numPixels; i++) {
      values[i] = imageData.data[i * 4 + 3] / 255.0;
    }

    this.detections = this.forwardPropagation(values);
    this.detectedNumber = this.indexMax(this.detections);
  }

  erase() {
    this.detections = [];
    this.detectedNumber = null;
    this.drawable.clear();
  }

  private forwardPropagation(imageData: number[]): number[] {
    const inputs: number[][] = [];
    for (let r = 0; r < imageData.length; r++) {
      inputs.push([imageData[r]]);
    }

    const hiddenInputs = math.multiply(this.weightsInputHidden, inputs);
    const hiddenOutputs = hiddenInputs.map(value => this.sigmoid(value));
    const finalInputs = math.multiply(this.weightsHiddenOutput, hiddenOutputs);
    const finalOutputs = finalInputs.map(value => this.sigmoid(value));
    return finalOutputs;
  }

  private indexMax(data: number[]): number {
    let indexMax = 0;
    for (let r = 0; r < data.length; r++) {
      indexMax = data[r] > data[indexMax] ? r : indexMax;
    }

    return indexMax;
  }

}
