import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit{
  @ViewChild('bik') bik: ElementRef<HTMLInputElement>;
  @ViewChild('custom') custom: ElementRef<HTMLInputElement>;
  @ViewChild('date') date: ElementRef<HTMLInputElement>;
  @ViewChild('email') email: ElementRef<HTMLInputElement>;
  @ViewChild('inn') inn: ElementRef<HTMLInputElement>;
  @ViewChild('kpp') kpp: ElementRef<HTMLInputElement>;
  @ViewChild('money') money: ElementRef<HTMLInputElement>;
  @ViewChild('phone') phone: ElementRef<HTMLInputElement>;
  @ViewChild('rs') rs: ElementRef<HTMLInputElement>;

  title = 'input-mask';

  public changePhoneToDate() {
    // this.phone2 = 'date';
  }

  public ngAfterViewInit() {
    this.bik.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.custom.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.date.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.email.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.inn.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.kpp.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.money.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.phone.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
    this.rs.nativeElement.addEventListener("maskError", event => console.log('maskError: ', event));
  }


}
