import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule,FormsModule  } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';


import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {MatChipsModule} from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { SmartMultiSelectComponent } from './components/smart-multi-select/smart-multi-select.component';
import { MatIconModule } from "@angular/material/icon";

@NgModule({
  declarations: [
    AppComponent,
    ConfirmationComponent,
    SmartMultiSelectComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSelectModule,
    ScrollingModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
