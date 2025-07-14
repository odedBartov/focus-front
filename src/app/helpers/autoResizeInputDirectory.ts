import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[autoResize]'
})
export class AutoResizeInputDirective {
  @Input() defaultHeight: string = 'auto';

  constructor(private element: ElementRef) {}

  @HostListener('input')
  onInput(): void {
    this.resize();
  }

  ngAfterContentChecked(): void {
    this.resize();
  }

  private resize(): void {    
    const textarea = this.element.nativeElement as HTMLTextAreaElement;
    textarea.style.height = this.defaultHeight;  // Reset to shrink if text was removed
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
