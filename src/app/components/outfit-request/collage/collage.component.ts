import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import createPanZoom, { PanZoom } from 'panzoom';
import { IItem } from 'src/app/interfaces/item.interface';
import { IconPickerComponent } from '../../util/icon-picker/icon-picker.component';

interface IImage {
  panZoom: PanZoom;
  element: HTMLImageElement;
}

interface ICoord {
  x: number;
  y: number;
}

@Component({
  selector: 'app-collage',
  templateUrl: './collage.component.html',
  styleUrls: ['./collage.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollageComponent implements AfterViewInit {
  @ViewChild('ttCopy', { static: true }) private readonly _ttCopy!: NgbTooltip;
  @ViewChild('iconPicker', { static: true, read: IconPickerComponent }) private readonly _iconPicker!: IconPickerComponent;
  @ViewChildren('collagePaste') private readonly _collagePaste!: QueryList<ElementRef>;
  @ViewChildren('collageImage') private readonly _collageImage!: QueryList<ElementRef>;

  @HostListener('window:focus', ['$event'])
  onWindowFocus(evt: Event): void {
    if (this.iPaste !== undefined) { this.focusPaste(evt); }
  }

  blockSize = {
    x: Array(6).fill(false),
    y: Array(3).fill(false)
  };
  collageSize: ICoord = { x: 4, y: 1 };
  files: Array<Array<string>>;
  itemIcons: Array<Array<string>>;
  images: Array<Array<IImage>>;
  iPaste?: number;
  iQuickPaste?: number;
  iIconPicker?: ICoord;

  _rendering = false;

  readonly sizes = {
    previewWidth: 192,
    previewHeight: 288,
    renderWidth: 192 * 1.5,
    renderHeight: 288 * 1.5,
    previewIconWidth: 64 * 2/3,
    renderIconWidth: 64
  };

  constructor(
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _renderer2: Renderer2
  ) {
    this.setCollageSize(4, 1);
    this.files = [];
    this.images = [];
    this.itemIcons = [];

    // Create empty files array.
    for (let iy = 0; iy < this.blockSize.y.length; iy++) {
      this.files.push([]); this.images.push([]);
      this.itemIcons.push([]);
      for (let ix = 0; ix < this.blockSize.x.length; ix++) {
        this.files[iy][ix] = '';
        this.itemIcons[iy][ix] = '';
      }
    }
  }

  ngAfterViewInit(): void {
    // Create panzoom for each image.
    for (let iy = 0; iy < this.blockSize.y.length; iy++) {
      for (let ix = 0; ix < this.blockSize.x.length; ix++) {
        const n = iy * this.blockSize.x.length + ix;
        const el = this._collageImage.get(n)?.nativeElement as HTMLImageElement;
        const p = this.createPanZoom(el);
        this.images[iy][ix] = { panZoom: p, element: el };
      }
    }
  }

  setCollageSize(w: number, h: number): void {
    this.collageSize = { x: w, y: h };
    this.stopPaste();

    this._changeDetectorRef.markForCheck();
  }

  startPaste(ix: number, iy: number, evt?: Event): void {
    this.iPaste = ix + iy * this.blockSize.x.length;

    // If quick paste is active, match it to the current paste.
    if (this.iQuickPaste !== undefined && this.iPaste !== this.iQuickPaste) {
      this.iQuickPaste = this.iPaste;
    }

    const el = this._collagePaste.get(this.iPaste!)?.nativeElement as HTMLInputElement;
    if (!el) { return; }

    el.value = '';
    evt?.preventDefault();
    evt?.stopPropagation();
    this._changeDetectorRef.markForCheck();
    setTimeout(() => { el.focus(); })
  }


  startQuickPaste(): void {
    if (this.iQuickPaste !== undefined)  {
      this.stopPaste();
      return;
    }

    this.iQuickPaste = this.iPaste !== undefined ? this.iPaste -1 : -1;
    this.quickPasteNext();
  }

  openIconPicker(x: number, y: number): void {
    this.iIconPicker = { x, y };
    this.itemIcons[y][x] = '';
    this._changeDetectorRef.markForCheck();
  }

  iconPickerClosed(): void {
    if (this.iIconPicker == undefined) { return; }
    this.iIconPicker = undefined;
    this._changeDetectorRef.markForCheck();
    this._changeDetectorRef.detectChanges();
  }

  iconPickerSelected(item: IItem): void {
    if (!this.iIconPicker) { return; }
    this.itemIcons[this.iIconPicker.y][this.iIconPicker.x] = item?.icon || '';
    this.iIconPicker = undefined;
    this._changeDetectorRef.markForCheck();
    this._changeDetectorRef.detectChanges();
  }

  private quickPasteNext(): void {
    if (this.iQuickPaste == undefined) { return; }
    let ix = 0; let iy = 0;
    while (iy < this.collageSize.y) {
      this.iQuickPaste++;
      ix = this.iQuickPaste % this.blockSize.x.length;
      iy = Math.floor(this.iQuickPaste / this.blockSize.x.length);
      if (ix < this.collageSize.x && iy < this.collageSize.y) { break; }
    }

    if (iy >= this.collageSize.y) {
      this.stopPaste();
      return;
    }

    this.startPaste(ix, iy);
  }

  onPanZoomEnd(): void {
    this.focusPaste();
  }

  focusPaste(evt?: Event): void {
    if (this.iPaste === undefined) { return; }
    const el = this._collagePaste.get(this.iPaste!)?.nativeElement as HTMLInputElement;
    if (!el) { return; }

    evt?.preventDefault();
    evt?.stopPropagation();
    el.focus();
  }

  stopPaste(evt?: Event): void {
    evt?.preventDefault();
    evt?.stopPropagation();
    this.iPaste = undefined;
    this.iQuickPaste = undefined;
    document.activeElement instanceof HTMLElement && document.activeElement.blur();
  }

  paste(event: ClipboardEvent, ix: number, iy: number): void {
    this._changeDetectorRef.markForCheck();
    const imgUrl = this.getImgUrlFromClipboard(event);
    if (!imgUrl) { return; }

    this.files[iy][ix] = imgUrl;
    //setTimeout(() => { this.copyPrevPanZoom(ix, iy); }, 500);
    this.iPaste = undefined;
    this.iQuickPaste !== undefined && this.quickPasteNext();
  }

  clearTxt(evt: Event): void{
    const inp = evt.target as HTMLInputElement;
    inp.value = '';
  }

  pickFile(ix: number, iy: number): void {
    this.files[iy][ix] = '';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.item(0);
      if (!file) { return; }
      const url  = URL.createObjectURL(file);
      this.files[iy][ix] = url;
      this._changeDetectorRef.markForCheck();
    };
    input.click();
  }

  clearFile(ix: number, iy: number): void {
    if (!confirm('Are you sure you want to remove this image?')) { return; }
    this.files[iy][ix] = '';
    this.itemIcons[iy][ix] = '';
    this._changeDetectorRef.markForCheck();
  }

  imageLoaded(ix: number, iy: number): void {
    this.copyPrevPanZoom(ix, iy);
    this._changeDetectorRef.markForCheck();
  }

  saveCollage(): void {
    const canvas = this.render();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'sky-outfit-collage.png';
    link.click();
  }

  copyCollage(): void {
    this._rendering = true;

    const doneRendering = () => { this._rendering = false; this._changeDetectorRef.detectChanges(); };
    try {
      const canvas = this.render();
      canvas.toBlob(blob => {
        if (!blob) { return doneRendering(); }
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          doneRendering();
          this._ttCopy.open();
          setTimeout(() => { this._ttCopy.close(); }, 1000);
        }).catch(error => {
          console.error('Could not copy image to clipboard: ', error);
          alert('Copying failed. Please make sure the document is focused.');
          doneRendering();
        });
      });
    } catch(e) { console.error(e); doneRendering(); }
  }

  reset(): void {
    if (!confirm('Are you sure you want to reset all images?')) { return; }
    for (let iy = 0; iy < this.blockSize.y.length; iy++) {
      for (let ix = 0; ix < this.blockSize.x.length; ix++) {
        this.files[iy][ix] = '';
        this.itemIcons[iy][ix] = '';
      }
    }
    this.iPaste = undefined;
    this.iQuickPaste = undefined;
    this._changeDetectorRef.markForCheck();

  }

  private createPanZoom(el: HTMLElement): PanZoom {
    return createPanZoom(el, {
      zoomSpeed: 0.05,
      smoothScroll: false
    });
  }

  private getPrevPanZoom(ix: number, iy: number): PanZoom | undefined {
    while (ix >= 0 && iy >= 0) {
      if (--ix < 0) { ix = 4; iy--; }
      if (iy < 0) { return undefined; }
      const img = this.images[iy][ix].element;
      if (img?.naturalWidth > 0) {
        return this.images[iy][ix].panZoom;
      }
    }
    return undefined;
  }

  private copyPrevPanZoom(ix: number, iy: number): void {
    const prev = this.getPrevPanZoom(ix, iy);
    prev ? this.copyPanZoom(prev, this.images[iy][ix].panZoom) : this.centerPanZoom(this.images[iy][ix]);
  }

  private copyPanZoom(from: PanZoom, to: PanZoom): void {
    to.moveTo(from.getTransform().x, from.getTransform().y);
    to.zoomAbs(from.getTransform().x, from.getTransform().y, from.getTransform().scale);
  }

  private centerPanZoom(image: IImage): void {
    if (!(image.element?.naturalWidth > 0)) { return; }
    const img = image.element;
    const panZoom = image.panZoom;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const pw = this.sizes.previewWidth;
    const ph = this.sizes.previewHeight;
    const fx  = pw / w;
    panZoom.zoomAbs(-2 * pw, 0, fx * 4);
  }

  private render(): HTMLCanvasElement {
    const _wBorder = 2;
    const hasIcons = this.itemIcons.some(r => r.some(i => i.length));

    const canvas = document.createElement('canvas');
    canvas.width = this.sizes.renderWidth * this.collageSize.x + _wBorder * (this.collageSize.x + 1);
    canvas.height = this.sizes.renderHeight * this.collageSize.y + _wBorder * (this.collageSize.y + 1) + (hasIcons ? 12 : 0);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawImage = (img: HTMLImageElement, x: number, y: number) => {
      const clipDiv =  img.closest('.collage-image-container') as HTMLElement;
      const imgBounds = img.getBoundingClientRect();
      const clipBounds = clipDiv.getBoundingClientRect();

      // Calculate starting coordinates of clipped image.
      const fx = (clipBounds.left - imgBounds.left) / imgBounds.width;
      const fy = (clipBounds.top - imgBounds.top) / imgBounds.height;
      const sx = fx * img.naturalWidth;
      const sy = fy * img.naturalHeight;
      const w = clipBounds.width / imgBounds.width * img.naturalWidth;
      const h = clipBounds.height / imgBounds.height * img.naturalHeight;

      // Draw the intersected part of the image on the canvas
      ctx.drawImage(img, sx, sy, w, h, (x+1) * _wBorder + x * this.sizes.renderWidth, (y+1) * _wBorder + y * this.sizes.renderHeight, this.sizes.renderWidth, this.sizes.renderHeight);

      // Draw the icon
      if (this.itemIcons[y][x]) {
        const img = document.querySelector(`.grid-collage-block[data-x="${x}"][data-y="${y}"] .collage-image-icon img`) as HTMLImageElement;
        if (!(img?.naturalWidth > 0)) { return; }
        ctx.fillStyle = '#0008';
        ctx.beginPath(); ctx.roundRect((x+1) * _wBorder + x * this.sizes.renderWidth + 4, (y+1) * _wBorder + y * this.sizes.renderHeight + this.sizes.renderHeight - this.sizes.renderIconWidth - 4, this.sizes.renderIconWidth, this.sizes.renderIconWidth, 8); ctx.fill();
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, (x+1) * _wBorder + x * this.sizes.renderWidth + 4, (y+1) * _wBorder + y * this.sizes.renderHeight + this.sizes.renderHeight - this.sizes.renderIconWidth - 4, this.sizes.renderIconWidth, this.sizes.renderIconWidth);
      }
    };

    // Draw  images
    for (let iy = 0; iy < this.collageSize.y; iy++) {
      for (let ix = 0; ix < this.collageSize.x; ix++) {
        const img = this.images[iy][ix].element;
        if (!(img?.naturalWidth > 0)) { continue; }
        drawImage(img, ix, iy);
      }
    }

    // Draw attribution
    if (hasIcons) {
      ctx.fillStyle = '#446';
      ctx.font = '12px Roboto, sans-serif';
      ctx.textAlign = 'right';
      const msg = this.collageSize.x === 1 ? 'Icons from Sky: Children of the Light Wiki'
        : 'Icons by contributors of the Sky: Children of the Light Wiki'
      ctx.fillText(msg, canvas.width - 4, canvas.height - 3);
    }

    return canvas;
  }

  private getImgUrlFromClipboard(event: ClipboardEvent): string | undefined {
    // Loosely based on https://stackoverflow.com/a/60504384/8523745
    if (!event.clipboardData) { return undefined; }
    var items = event.clipboardData.items;
    if (!items) { return undefined; }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].type.includes('image')) continue;
      const file = items[i].getAsFile();
      return file ? URL.createObjectURL(file) : undefined;
    }

    return undefined;
  }
}
