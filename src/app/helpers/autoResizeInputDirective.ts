import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[autoResize]'
})
export class AutoResizeInputDirective {
  @Input() defaultHeight: string = 'auto';
  private resizePending = false;

  constructor(private element: ElementRef) { }

  @HostListener('input')
  onInput(): void {
    if (!this.resizePending) {
      this.resizePending = true;
      requestAnimationFrame(() => {
        this.resize();
        this.resizePending = false;
      });
    }
  }

  ngAfterContentChecked(): void {
    this.resize();
  }

  resize(): void {
    const textarea = this.element.nativeElement as HTMLTextAreaElement;

    // Find the nearest scrollable parent
    const scrollableParent = this.findScrollableParent(textarea);
    const scrollTop = scrollableParent?.scrollTop;

    // Reset and resize
    textarea.style.height = this.defaultHeight;  // Reset height to shrink if needed
    textarea.style.height = textarea.scrollHeight + 'px';
    // Restore scroll position
    if (scrollableParent && scrollTop !== undefined && scrollableParent.scrollTop !== scrollTop) {
      scrollableParent.scrollTop = scrollTop;
    }
  }

  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
}
