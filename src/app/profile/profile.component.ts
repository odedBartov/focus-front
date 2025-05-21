import { Component, inject } from '@angular/core';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { HttpService } from '../services/http.service';
import { debounceTime, Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [NgxEditorModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  http = inject(HttpService);
  editor = new Editor();
  newInsight = '';
  private valueChangesSub!: Subscription;

  constructor() {
    this.valueChangesSub = this.editor.valueChanges.subscribe(content => {
      //this.newInsight = content;
    });
  }

  createInsight() {
    this.http.createInsight(this.editor.);
  }
}
