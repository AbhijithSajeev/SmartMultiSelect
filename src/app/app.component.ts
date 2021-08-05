import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private _formbuilder: FormBuilder,){

  }
  // Search filter form
  testForm: FormGroup = this._formbuilder.group({
    testdropdown: ["", Validators.required],
  });

  searchInputPlaceholder: string = "Search";
  testDropDownLabel: string = "Smart Multi Dropdown";
  testFormControlName: string = "testdropdown";
  selectAllText = "Select all";
  filterChangeConfirmationMessage ="This will clear the search results. Do you want to proceed?";
  reValidate: boolean = false;
  filterFormControlErrorMessage="Please select a value";
  isdataLoading = false;

  testData = this.getMockData();


  getMockData() {
    return ([
      { display: "Item 1", value: "Item1", selected: false },
      { display: "Item 2", value: "Item2", selected: false }
    ]);
  }
}
