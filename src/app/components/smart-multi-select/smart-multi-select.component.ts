import {
  CdkVirtualScrollViewport,
} from "@angular/cdk/scrolling";
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import {
  ControlContainer,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDialog } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { Observable, Subject } from "rxjs";
import { debounceTime, map, startWith, takeUntil } from "rxjs/operators";
import { ConfirmationComponent } from "../confirmation/confirmation.component";

@Component({
  selector: 'smart-multi-select',
  templateUrl: './smart-multi-select.component.html',
  styleUrls: ['./smart-multi-select.component.scss']
})
export class SmartMultiSelectComponent implements OnInit, OnDestroy {
  constructor(
    private _dialog: MatDialog,
    private _formbuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private _controlContainer: ControlContainer
  ) {
  }
  parentForm: FormGroup;
  @ViewChild('matformfield', { static: true }) input: any;
  viewportWidth:number;
  scrolledToBottom:boolean= false;

  // life cycle hooks
  ngOnInit(): void {
    this.parentForm = <FormGroup>this._controlContainer.control;
  }

  ngAfterViewInit(): void {
    this.setFilterDataObject();
    this.setSearchInputEmitter();

    if (this.enableValidation) {
      this.parentForm.controls[this.formControlName].setValidators([
        Validators.required,
      ]);
    }
    this.filteredData.subscribe(data=>{
      this.showSelectAllWhenSearch=data?.length<this.data?.length? false: true; 

      var defaultHeight = ((data.length==0&& this.data?.length==0) || !this.showSelectAllWhenSearch) ?30.8: (30.8*2);
      this.matSelectHeight= data?.length<7? ((30.8* data.length)+defaultHeight): 246.4; // minimum 2 items and maximum 8 items    
    })
    this.cdr.detectChanges();
    if(this.input){
    this.viewportWidth= this.input._elementRef.nativeElement.offsetWidth - 44;
  }
  }

  openDropdown(){
    this.selectElem.open();
    this.changeParentFormValue(
      this.formControlName,
      this.selectedOptions.map((p) => p.value) ?? []
    );
    this.virtualScroll.checkViewportSize();
    this.parentForm.markAllAsTouched();
  }

  //inputs
  /** Receives the data. */
  _data: any;
  @Input("data") get data(): any {
    return this._data;
  }
  set data(val: any) {
    this._data = val;   
    if (!val || val == "" || val == "null" || val.length == 0) {
      this.setFilterDataObject();
      if (!this.showSelectAllOnly) {
        this.emptyDropdown();
      }
      this.isDataAvailable=false;
    } else {
      if (this.defaultValue) {
        this.setDefaultOption();
      } else {
        this.selectAll();
      }
      this.isDataAvailable=true;
      this.clearInput();
    }
    this.selectedLabelText = this.selectedLabel();
  }
  /** Receives confirmation that the grid that rely on the dropdown got the search result 
   *  so that we can decide whether to show the confirmation whether to clear the dropdown selection. 
  */
  @Input("searchResultFetched") searchResultFetched: boolean = false;

  /** Cascading error message of the dropdown. i.e., When the dropdown didn't get any data based on 
  * the previous filter selection. 
  */
  @Input("cascadingErrorMessage") cascadingErrorMessage: string = "Not data found";

    /** Previous form control name that is used to fetch data in the dropdown. */
  @Input("previousFormControlName") previousFormControlName: string;

    /** Receives form control name. */
  @Input("controlName") formControlName: string;

   /** Receives the dropdown label. */
  @Input("dropDownLabel") dropDownLabel: string = "";

     /** Receives the search inputs placeholder. */
  @Input("searchInputPlaceholder") searchInputPlaceholder: string="Search";

    /** Whether to disable the search input. */
  @Input("disableSearchbox") disableSearchbox: boolean = false;

    /** Whether to enable selection change confirmation. */
  @Input("enableSelectionChangeConfirmation")
  enableSelectionChangeConfirmation: boolean = false;

   /** Receives the selection change confirmation message. */
  @Input("selectionChangeConfirmationMessage")
  selectionChangeConfirmationMessage: string ="This will clear search result. Do you want to proceed?";

  /** Whether to enable validation. */
_enableValidation: boolean = false;
  @Input("enableValidation") 
  get enableValidation(): boolean{
    return this._enableValidation;
  };
  set enableValidation(val){
    this._enableValidation = val;
    this.enableValidation
  }

  /** Whether to revalidate the dropdown validation. */
  _reValidate: any = false;
  @Input("reValidate")
  get reValidate(): boolean {
    return this._reValidate;
  }
  set reValidate(val: boolean) {
    this._reValidate = val;
    if (this._reValidate) {
      this.parentForm.markAllAsTouched();
    }
  }

  /** Receives validation message. */
  @Input("ValidationMessage") ValidationMessage: string = "Please select a value";
  
  /** Receives default value for dropdown. */
  @Input("defaultValue") defaultValue: string;

  /** Receives dropdown data loading status. */
  @Input("dataLoadingStatus") dataLoadingStatus: boolean = false;

  /** At what interval the search input event should be raised. */
  @Input("searchInputChangeEventInterval")
  searchInputChangeEventInterval: number = 0;

  /** Whether to disable the dropdown client side search. */
  @Input("disableClientSideSearch") disableClientSideSearch: boolean = false;

  /** Receives select all option text. */
  @Input("selectAllText") selectAllText: string="Select all";

  /** Whether to show only select all option in dropdown */
  private _showSelectAllOnly: boolean = false;
  @Input("showSelectAllOnly")
  get showSelectAllOnly(): boolean {
    return this._showSelectAllOnly;
  }
  set showSelectAllOnly(val: boolean) {
    this._showSelectAllOnly = val;
    if (this._showSelectAllOnly) {
      this.data=[];
      this.selectAll();
    }
  }

  // Outputs
  /** Event emitted when any option is changed. */
  @Output("optionChanged") optionChanged = new EventEmitter();

    /** Event emitted when search input value is changed. Value emitted will be the text entered. */
  @Output("searchInputChanged") searchInputChanged = new EventEmitter();

    /** Event emitted when dropdown is scrolled to the bottom. */
  @Output("selectScrolled") selectScrolled = new EventEmitter();

  /** Variables */
  canProceed: boolean = false;
  matChipSelectable = true;
  matChipRemovable = true;
  isDataAvailable: boolean = false;
  selectedOptions: any[] = null;
  selectAllChecked: boolean = true;
  filteredData: Observable<any>;
  selectedLabelText: string = "";
  showSelectAllWhenSearch: boolean = true;

  /** ViewChild references */
  @ViewChild(CdkVirtualScrollViewport) virtualScroll: CdkVirtualScrollViewport;
  @ViewChild("trigger") trigger: MatAutocompleteTrigger;
  @ViewChild("select") selectElem: MatSelect;
  
  /** setting default value in the dropdown */
  private setDefaultOption() {
    if (this.checkDefaultValueExist()) {
      this.setDefaultDataBinding();
      this.optionChanged.emit({
        hasChanged: true,
        selectedOption: this.defaultValue,
        deselectedOption: null,
        totalSelections: this.selectedOptions.map((p) => p.value),
      });
    } else {
      this.setselectAllDataBinding();
      return;
    }
  }

  /** Form for the search input */
  form: FormGroup = this._formbuilder.group({
    dataSearchInput: [],
    data: [""],
  });

  /** To change parent form value */
  private changeParentFormValue(control, data) {  
    if(this.parentForm && this.parentForm.contains(control)){
    this.parentForm.controls[control].setValue(data);
    this.parentForm.controls[control].updateValueAndValidity();
    }
  }

   /** To change search input form value */
  private changeFormValue(control, data) {
    if(this.form && this.form.contains(control)){
    this.form.controls[control].setValue(data);
    this.form.controls[control].updateValueAndValidity();
    }
  }

  /** Setting searchable observable */
  private searchSubscription: Subject<void> = new Subject();
  private setFilterDataObject() {
    this.filteredData = this.form.controls["dataSearchInput"].valueChanges.pipe(
      takeUntil(this.searchSubscription),
      startWith(""),
      map((value) => (typeof value === "string" ? value : value?.name)),
      map((name) =>
        name ? this.disableClientSideSearch  ? this._filter("") : this._filter(name) : this.data
      )
    );
  }
  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.data.filter((option) =>
      option.display.toLowerCase().includes(filterValue)
    );
  }

  /** Setting search input emitter */
  private setSearchInputEmitter() {
    this.form.controls["dataSearchInput"].valueChanges
      .pipe(debounceTime(this.searchInputChangeEventInterval))
      .subscribe((p) => this.searchInputChanged.emit(p));
  }

  /** To validate whether to show data change confirmation message or not */
  private async filterDataChangeVerification() {
    if (this.enableSelectionChangeConfirmation) {
      const dialogResult = await this.openConfirmationDialog(
        this.selectionChangeConfirmationMessage,
        ConfirmationComponent
      ).toPromise();
      if (dialogResult) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  /** Opens selection change confirmation dialogue */
  private openConfirmationDialog(message: string, componentType:any): Observable<any> {
    const dialogRef = this._dialog.open(componentType, {
      data: {
        msg: message,
      },
    });
    return dialogRef.afterClosed();
  }

  /** To select all items in dropdown */
  private selectAll() {
    if (this.data?.length > 0 || this.showSelectAllOnly) {
      this.setselectAllDataBinding();
      this.optionChanged.emit({
        hasChanged: true,
        selectedOption: "-1",
        deselectedOption:null,
        totalSelections: this.selectedOptions.map((p) => p.value),
      });
      this.cdr.detectChanges();
    }
  }

  /** To clear all bindings in dropdown */
  private clearDropdownSelection() {
    this.clearDropdownBinding();
  }

  /** To deselect all items in dropdown */
  private deSelectAll() {
    this.clearDropdownBinding();
    this.optionChanged.emit({
      hasChanged: true,
      selectedOption:null,
      deselectedOption:null,
      totalSelections:null,
    });
  }

  /** Deselects 'All' option when any of the option deselected */
  private removeSelectAllValueFromFormControl() {
    var selectAllIndex = this.selectedOptions.findIndex(
      (value) => value.value === "-1"
    );
    if (selectAllIndex != -1) {
      this.parentForm.controls[this.formControlName].value.splice(
        selectAllIndex,
        1
      );
      (this.parentForm.controls[this.formControlName].value?.length == 0
      )
          ? this.changeParentFormValue(this.formControlName, null)
          : false;
      this.selectedOptions.splice(selectAllIndex, 1);
    }
  }

  /** To manage select all and deselect all events */
  async toggleSelectAll(event) {
    event.preventDefault();
    event.stopPropagation();
    this.canProceed = await this.filterDataChangeVerification();
    if (this.canProceed) {
    if (this.selectAllChecked) {
      this.deSelectAll();
    } else {
      this.selectAll();
    }
    }
  }

  /** To manage dropdown item selection events except for all option */
  async toggleOptionSelection(event: Event, item: any) {
    event.preventDefault();
    event.stopPropagation();
    this.canProceed = await this.filterDataChangeVerification();
    if (this.canProceed) {
      if (this.selectedOptions === undefined) {
        this.selectedOptions = [];
      }
      const index = this.selectedOptions.findIndex(
        (value) => value["value"] === item["value"]
      );

      if (index === -1) {
        if (item["display"].length > 0) {
          item["selected"] = true;
          this.selectedOptions.push(item);
          this.changeParentFormValue(
            this.formControlName,
            this.selectedOptions.map((p) => p.value) ?? []
          );
          if (
            this.data.filter((p) => p.value != "-1").length ==
            this.selectedOptions.filter((p) => p.value != "-1").length
          ) {
            this.selectAll();
            return;
          }
          this.optionChanged.emit({
            hasChanged: true,
            selectedOption: item["value"],
            deselectedOption:null,
            totalSelections: this.selectedOptions.map((p) => p.value),
          });
        }
      } else {
        this.selectAllChecked = false;
        item["selected"] = false;
        this.selectedOptions.splice(index, 1);
        this.parentForm.controls[this.formControlName].value.splice(index, 1);
        this.parentForm.controls[this.formControlName].value == ""
          ? this.changeParentFormValue(this.formControlName, null)
          : false;
        this.removeSelectAllValueFromFormControl();
        this.optionChanged.emit({
          hasChanged: true,
          selectedOption: null,
          deselectedOption: item["value"],
          totalSelections: this.selectedOptions.length==0? null: this.selectedOptions.map((p) => p.value),
        });
      }
      this.selectedLabelText = this.selectedLabel();
    } else {
      return false;
    }
  }

  /** To get the dropdown item selected count label */
  private selectedLabel() {
    if (this.selectAllChecked) {
      return "All Selected";
    } else if (this.selectedOptions?.length > 0) {
      return `${this.selectedOptions?.length} Selected`;
    }
    else{
      return ""
    }
  }

/** For tracking dropdown list items */
  trackByIdx(i) {
    return i;
  }
 
 /** Event emitted when dropdown is scrolled to the bottom. */
  nextBatch(event){
    if(this.virtualScroll.getRenderedRange().end==this.virtualScroll.getDataLength()){
      if(!this.scrolledToBottom){           
        this.selectScrolled.emit(
          this.virtualScroll.measureScrollOffset("bottom")
     );
     this.scrolledToBottom=true;
      }
    }
    else{
      this.scrolledToBottom=false;
    }
  }

  // utilities
  /** To show tooltip for dropdown */
  getTooltipText() {
    return this.parentForm.controls[this.formControlName].invalid
      ? `You need to select a ${this.dropDownLabel}!`
      : this.selectAllChecked
      ? "All Selected"
      : `${this.selectedOptions?.length ?? 0} Selected`;
  }

  // Clear
  /** Calls when dropdown is cleared. Clearing will deselect all items in dropdown and its bindings */
  async dropdownSelectionClear() {
    this.canProceed = await this.filterDataChangeVerification();
    if (this.canProceed) {
      this.clearDropdownSelection();
    }
  }

  /** To empty the dropdown by removing all bindings */
  private emptyDropdown() {
    this.selectAllChecked = false;
    this.selectedOptions = [];
    this.setFilterDataObject();
    setTimeout(() => {
      this.changeParentFormValue(this.formControlName, null);
    }, 0);
    this.isDataAvailable = true;
    this.optionChanged.emit({
      hasChanged: true,
      selectedOption:null,
      deselectedOption:null,
      totalSelections: null,
    });
  }

  /** Cleared the search input values */
  private clearInput() {
    this.changeFormValue("clientSearchText","")
  }

  /** Check to see the default value provided is in the data */
  private checkDefaultValueExist() {
    return this.data.findIndex((item) => item.value == this.defaultValue) > -1;
  }

  /** To clear all bindings in dropdown */
  private clearDropdownBinding() {
    this.selectAllChecked = false;
    this.selectedOptions = [];
    this.changeParentFormValue(this.formControlName, null);
    this.parentForm.controls[this.formControlName].markAsTouched();
    this.data.forEach((x) => (x["selected"] = false));
    this.isDataAvailable = true;
    this.selectedLabelText = this.selectedLabel();
    this.optionChanged.emit({
      hasChanged: true,
      selectedOption:null,
      deselectedOption:null,
      totalSelections: null,
    });
  }

 /** Sets default value */
  private setDefaultDataBinding() {
    this.selectAllChecked = false;
    this.selectedOptions = [];
    this.data.map((element) => {
      element.value == this.defaultValue
        ? (element.selected = true)
        : (element.selected = false);
    });
    Object.assign(
      this.selectedOptions,
      this.data.filter((item) => item.value == this.defaultValue)
    );
    this.changeParentFormValue(
      this.formControlName,
      this.selectedOptions.map((p) => p.value) ?? []
    );
    this.changeFormValue("dataSearchInput", "");
    this.selectedLabelText = this.selectedLabel();
  }

  /** Sets bindings when selecting all items in the dropdown */
  private setselectAllDataBinding() {
    this.selectAllChecked = true;
    this.selectedOptions = [];
    this.data.forEach((data) => {
      data.selected = true;
    });
    Object.assign(this.selectedOptions, this.data);
    this.selectedOptions.unshift({
      display: "All",
      value: "-1",
      selected: true,
    });
    this.changeParentFormValue(
      this.formControlName,
      this.selectedOptions.map((p) => p.value) ?? []
    );
    this.changeFormValue("dataSearchInput", "");
    this.selectedLabelText = this.selectedLabel();
  }

  /** Resets dropdown to the initial state */
  async resetDropdown() {
    this.canProceed = await this.filterDataChangeVerification();
    if (this.canProceed) {
      if (this.defaultValue && this.checkDefaultValueExist()) {
          this.setDefaultOption();
      } else {
       (this.data.length>0 || this.showSelectAllOnly) ?this.selectAll(): false;
      }
      this.clearInput();
    }
  }

  /** Sets virtual scroll viewport height */
  matSelectHeight:number;
  getMatSelectHeight(){
    var defaultHeight = this.data.length==0?30.8: (30.8*2);
    this.matSelectHeight= this.data?.length<10? ((30.8*this.data.length)+defaultHeight): 255.6;
  }

  /** Checks whether previous form control provided is in valid state or not */
  private isPreviousFormControlValid(){
    if(this.parentForm.contains(this.previousFormControlName)){
      return this.parentForm.get(this.previousFormControlName).valid;
    };
    return true;
  }

  /** Checks whether previous form control name is provided or not */
  private isPreviousFormControlProvided(){
    return this.previousFormControlName?.length>0;
  }

  /** Checks whether to display mat hint */
  showMatHintForFormField(){
   return !this.isDataAvailable && (this.isPreviousFormControlValid() && this.isPreviousFormControlProvided()) && !this.selectAllChecked;
  }
  
  ngOnDestroy(): void {
    this.searchSubscription.next();
    this.searchSubscription.complete();
  }
}
