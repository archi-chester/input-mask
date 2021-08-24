import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'custom-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.css']
})
export class CustomInputComponent implements OnInit {
  @Input() maskType: string = "";
  @Input() maskOptions: string = "";
  @Input() label: string = "";
  @Input() public placeHolder: string = "";

  public data: string = "";

  constructor() { }

  ngOnInit(): void {
  }

  private dateNormalize(dirtyDate: string): string {
    let dirtyArray = [...dirtyDate];
    let clearArray = [];
    dirtyArray.forEach(dirtyChar => {

      if (dirtyChar === '.' ||
        dirtyChar === '1' ||
        dirtyChar === '2' ||
        dirtyChar === '3' ||
        dirtyChar === '4' ||
        dirtyChar === '5' ||
        dirtyChar === '6' ||
        dirtyChar === '7' ||
        dirtyChar === '8' ||
        dirtyChar === '9' ||
        dirtyChar === '0'
      ) {
        clearArray.push(dirtyChar);
      }
    });
    const separateDateArray = clearArray.join("").split(".");
    let clearDate: string = "";

    //  Число
    if (separateDateArray.length > 0) {
      let daysArray = [...separateDateArray[0]];
      //  Одна цифра
      if (daysArray.length === 1 && daysArray[0] !== ".") {
        clearDate += daysArray[0];
        if (
          daysArray[0] !== "0" &&
          daysArray[0] !== "1" &&
          daysArray[0] !== "2" &&
          daysArray[0] !== "3") {
          clearDate += ".";
        }
      } else if (
        daysArray.length === 2 && (
          (daysArray[0] === "0" && daysArray[1] !== ".") ||
          daysArray[0] === "1" ||
          daysArray[0] === "2" || (
          daysArray[0] === "3" && (daysArray[1] === "0" || daysArray[1] === "1")
        )
        )) {
        clearDate += daysArray[0] + daysArray[1] + ".";
      }
    }

    //  Месяц
    if (separateDateArray.length > 1) {
      let monthArray = [...separateDateArray[1]];
      //  Одна цифра
      if (monthArray.length === 1 && monthArray[0] !== "0" && monthArray[0] !== ".") {
        clearDate += monthArray[0];
        if (
          monthArray[0] !== "0" &&
          monthArray[0] !== "1") {
          clearDate += ".";
        }
      } else if (
        monthArray.length === 2 && (
          monthArray[0] === "0" || (
            monthArray[0] === "1" && (monthArray[1] === "0" || monthArray[1] === "1" || monthArray[1] === "2")
          )
        )) {
        clearDate += monthArray[0] + monthArray[1] + ".";
      }
    }

    //  Год
    if (separateDateArray.length > 2) {
      let yearArray = [...separateDateArray[2]].filter(digit => digit !== ".");
      if (yearArray.length > 0) {
        clearDate += yearArray[0];
      }
      if (yearArray.length > 1) {
        clearDate += yearArray[1];
      }
      if (yearArray.length > 2) {
        clearDate += yearArray[2];
      }
      if (yearArray.length > 3) {
        clearDate += yearArray[3];
      }
    }
    return clearDate;
  }

  public normalize(dirtyText: string): string {
    switch (this.maskType) {
      case "date":
        return this.dateNormalize(dirtyText);
        break;
      case "phone":
        // console.log("phone");
        return this.phoneNormalize(dirtyText);
        break;
      default:
        console.log("default");
    }
    return dirtyText;
  }

  onBackspaceKey(event, ref: HTMLInputElement) {
    const dirtyString = event.target.valueж
    if (dirtyString.substring(dirtyString.length - 1, dirtyString.length ) === ".") {
      ref.value = String(dirtyString).substring(0, dirtyString.length - 1);
    } else if  ((dirtyString.substring(dirtyString.length - 2, dirtyString.length ) === " (") ||
      (dirtyString.substring(dirtyString.length - 2, dirtyString.length ) === ") ")) {
      ref.value = String(dirtyString).substring(0, dirtyString.length - 2);
    }
  }

  public onKeyPress(event, ref: HTMLInputElement) {
    console.log(event.target.value);
    ref.value = this.normalize(event.target.value);
  }

  private phoneNormalize(dirtyPhone: string): string {
    let dirtyArray = [...dirtyPhone];
    let clearArray = [];
    dirtyArray.forEach(dirtyChar => {

      if (dirtyChar === '1' ||
        dirtyChar === '2' ||
        dirtyChar === '3' ||
        dirtyChar === '4' ||
        dirtyChar === '5' ||
        dirtyChar === '6' ||
        dirtyChar === '7' ||
        dirtyChar === '8' ||
        dirtyChar === '9' ||
        dirtyChar === '0'
      ) {
        clearArray.push(dirtyChar);
      }
    });
    console.log(clearArray);
    let clearPhone: string = "+";

    if (clearArray.length > 0) {
      clearPhone += clearArray[0] + " ("
    }

    if (clearArray.length > 1) {
      clearPhone += clearArray[1];
    }

    if (clearArray.length > 2) {
      clearPhone += clearArray[2];
    }

    if (clearArray.length > 3) {
      clearPhone += clearArray[3] + ") ";
    }

    if (clearArray.length > 4) {
      clearPhone += clearArray[4];
    }

    if (clearArray.length > 5) {
      clearPhone += clearArray[5];
    }

    if (clearArray.length > 6) {
      clearPhone += clearArray[6] + "-";
    }

    if (clearArray.length > 7) {
      clearPhone += clearArray[7];
    }

    if (clearArray.length > 8) {
      clearPhone += clearArray[8] + "-";
    }

    if (clearArray.length > 9) {
      clearPhone += clearArray[9];
    }

    if (clearArray.length > 10) {
      clearPhone += clearArray[10];
    }

    return clearPhone;
  }

}
