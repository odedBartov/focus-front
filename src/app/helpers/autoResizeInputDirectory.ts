import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[autoResize]'
})
export class AutoResizeInputDirective {
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
    textarea.style.height = 'auto';  // Reset to shrink if text was removed
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
