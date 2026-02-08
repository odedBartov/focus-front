import { AfterViewInit, Directive, ElementRef } from "@angular/core";

@Directive({
    selector: '[appAutofocus]',
    standalone: true
  })
  export class AutofocusDirective implements AfterViewInit {
    constructor(private el: ElementRef) {}
  
    ngAfterViewInit() {
      // The timeout ensures the DOM has finished painting
      setTimeout(() => this.el.nativeElement.focus());
    }
  }