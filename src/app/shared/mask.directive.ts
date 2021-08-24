import {Directive, ElementRef, HostListener, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {isNumeric} from "rxjs/internal-compatibility";

@Directive({
  selector: '[mask]'
})
export class MaskDirective implements OnInit {
  @Input() maskType: string = '';
  @Input() maskOptions: string = "";
  // @ViewChild('bik') bik: ElementRef<HTMLInputElement>;
  public currentRef: ElementRef;

  //  переменная с чистым текстом
  clearCustom: string;
  //  переменная с чистым текстом до обработки
  clearString: string = '';
  //  массив для заполнителей в кастомной маске
  fillerFilterArray: string[] = [];
  //  массив для данных в кастомной маске
  dataFilterArray: string[] = [];
  //  текущий введенный символ при кастомной маске
  customCharIndex = 0;
  //  текущее значение текстового поля
  currentValue: string;
  //  последняя нажатая клавиша
  lastKeyPress: string;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.currentRef = el;
    //  добавляем прослушку событий нажатия кнопки на инпут
    el.nativeElement.addEventListener('keyup', this.keyUpFunc.bind(this), true);
    el.nativeElement.addEventListener('keypress', this.keyPressFunc.bind(this), true);
    el.nativeElement.addEventListener('keydown', this.keyDownFunc.bind(this), true);

    //  инитим переменную для кастома
    this.clearCustom = '';
  }

  ngOnInit() {
    //  расшиваем маску в массив
    if (this.maskOptions && this.maskOptions.length) {
      this.prepareCustomMask(this.maskOptions);
    }
  }

  private addSpaceToMoney(dirtyString: string): string {
    console.log('addSpaceToMoney');
    const size = dirtyString.length;
    console.log('size: ', size)
    if (size === 0) {
      return dirtyString;
    }

    //  заводим служебные переменные
    let prefixString = '';
    let fullArray = [...dirtyString];
    let fullString = "";

    //  здесь отрезаем префикс для того чтобы тело осталось по тройкам
    if (size % 3 === 1) {
      prefixString = fullArray[0];
      fullArray.splice(0, 1);
    } else if (size % 3 === 2) {
      console.log('size 2')
      prefixString = fullArray[0] + fullArray[1];
      fullArray.splice(0, 2);
    }

    //  добавляем пробелы после каждой тройки основного тела кроме последней
    fullArray.forEach((symbol, index) => {
      fullString += symbol;
      if ((index % 3 === 2) && (index !== fullArray.length - 1)) {
        fullString += " ";
      }
    })

    //  добавляем пробел к префиксу если надо
    if (fullString.length > 0 && prefixString.length > 0) {
      prefixString += " ";
    }

    return prefixString + fullString;
  }

  private createCustomEvent(type: string, textError: string): CustomEvent {
    // @ts-ignore
    return new CustomEvent("maskError", {
          detail: {
          type,
          textError
      }
    })
  }

  //  обработка факта нажатия кнопки (down)
  private keyDownFunc(event) {
    //  останавливаем дальнейшую рассылку события
    event.stopPropagation();
    //  получаем текущее значение инпута
    const value: string = String(event.target.value);
    //  сохраняем  последнюю нажатую клавишу
    this.lastKeyPress = String(event.key);
    //  в функцию отрисовки вернется значение полученное из нормализатора
    this.renderer.setProperty(this.currentRef.nativeElement, 'value', this.normalize(value + this.lastKeyPress));
  }

  //  обработка факта нажатия кнопки (press)
  private keyPressFunc(event) {
    // event.stopPropagation();
    event.preventDefault();
    const value: string = String(event.target.value);
    //  номер телефона не может быть больше 18 символов (надо проверить может эта проверка нафиг не нужна)
    if (this.maskType === 'phone' && value.length > 18) {
      // console.log('stopImmediatePropagation')
      event.stopImmediatePropagation();
      this.renderer.setProperty(this.currentRef.nativeElement, 'value', value.substring(0, 18));
    }
  }

  //  обработка факта нажатия кнопки (up)
  private keyUpFunc(event) {
    event.preventDefault();
    const value: string = String(event.target.value);
    // const dateArray = value.split('.')
    //  номер телефона не может быть больше 18 символов (надо проверить может эта проверка нафиг не нужна)
    if (this.maskType === 'phone' && value.length > 18) {
      // console.log('stopImmediatePropagation')
      event.stopImmediatePropagation();
      this.renderer.setProperty(this.currentRef.nativeElement, 'value', value.substring(0, 18));
    }
    //  сохраняем нажатую клавишу в переменную
    this.lastKeyPress = event.key;
  }

  //  листенер для корректного удаления символов маски
  @HostListener('keyup.backspace', ['$event', 'currentRef']) onBackspaceKey(event, currentRef) {
    //  передаем в функцию отрисовки текст без одного символа
    this.renderer.setProperty(currentRef.nativeElement, 'value', this.deleteOneSymbol());
  }

  //  инн, кпп, бик, расчетный счет, email, деньги
  //  селектор нормализации
  public normalize(dirtyText: string): string {
    switch (this.maskType) {
      case "bik":
        return this.bikNormalize(this.lastKeyPress);
        break;
      case "custom":
        return this.customNormalize(this.lastKeyPress);
        break;
      case "date":
        return this.dateNormalize(dirtyText);
        break;
      case "email":
        return this.emailNormalize(this.lastKeyPress);
        break;
      case "inn":
        return this.innNormalize(this.lastKeyPress);
        break;
      case "kpp":
        return this.kppNormalize(this.lastKeyPress);
        break;
      case "money":
        return this.moneyNormalize(this.lastKeyPress);
        break;
      case "phone":
        return this.phoneNormalize(dirtyText);
        break;
      case "rs":
        return this.rsNormalize(this.lastKeyPress);
        break;
      default:
        console.log("default");
    }
    return dirtyText;
  }

  private buildMoneyChunks(clearString: string): string[] {

    //  дробим строку на две половины
    let chunks: string[] = [clearString];
    if (this.clearString.indexOf('.') !== -1) {
      chunks = this.clearString.split('.');
    }
    if (this.clearString.indexOf(',') !== -1) {
      chunks = this.clearString.split(',');
    }
    if (this.clearString.indexOf('.') !== -1) {
      chunks = this.clearString.split('.');
    }
    if (this.clearString.indexOf(',') !== -1) {
      chunks = this.clearString.split(',');
    }
    return chunks;
  }

  //  построение денег
  private buildMoneyString(moneyChunks: string[]): string {
    // console.log('buildMoneyString, moneyChunks:', moneyChunks);
    let clearMoney: string;

    clearMoney = this.addSpaceToMoney(moneyChunks[0]);
    // console.log('addSpaceToMoney, clearMoney:', clearMoney);

    if (moneyChunks.length === 2) {
      clearMoney = clearMoney + "." + moneyChunks[1];
    }

    // console.log(this.clearString)
    return clearMoney;
  }

  //  построение телефона
  private buildPhoneString(clearString: string): string {
    let clearArray = [];

    clearArray = [...clearString];

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

    this.currentValue = clearPhone;

    return clearPhone;
  }

  //  построение строки кастома
  private buildCustomString(clearString: string): string {
    //  создаем служебные переменные
    let fullString: string = '';
    //  размазываем строку в массив, чтобы проще было работать с символами
    const clearArray: string[] = [...clearString]
    clearArray.forEach((clearSymbol, index) => {
      //  пока в заполнителях что-то есть - вставляем заполнители перед символами
      if (this.fillerFilterArray.length > index) {
        fullString += this.fillerFilterArray[index] + clearSymbol;
      }
    })

    return fullString;
  }

  //  кастомная нормализация
  private customNormalize(lastPressedKey: string): string {
    //  проверяем последнюю кнопку
    if (this.testSymbol(lastPressedKey) && lastPressedKey !== 'Backspace') {
      //  добавляем символ к чистой строке
      this.clearString += lastPressedKey
      //  увеличиваем текущий указатель на последний символ
      this.customCharIndex++;
    }
    //  вызываем построитель
    return this.buildCustomString(this.clearString);
  }

  //  нормализация для даты
  private dateNormalize(dirtyDate: string): string {
    let dirtyArray = [...dirtyDate];
    let clearArray = [];
    dirtyArray.forEach(dirtyChar => {

      // if (dirtyChar === '.' ||
      //   dirtyChar === '1' ||
      //   dirtyChar === '2' ||
      //   dirtyChar === '3' ||
      //   dirtyChar === '4' ||
      //   dirtyChar === '5' ||
      //   dirtyChar === '6' ||
      //   dirtyChar === '7' ||
      //   dirtyChar === '8' ||
      //   dirtyChar === '9' ||
      //   dirtyChar === '0'
      // ) {
      //   clearArray.push(dirtyChar);
      // }

      if (this.isCharDigit(dirtyChar) || dirtyChar === '.'
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
        clearDate += monthArray[0] + monthArray[1] + '.';
        if (this.lastKeyPress !== 'Backspace') {
          // clearDate += '.';
        }
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

    this.currentValue = clearDate;

    return clearDate;
  }

  //  функция возвращает значения без одного символа
  private deleteOneSymbol(): string {
    switch (this.maskType) {
      case "bik":
        return this.deleteOneSymbolBik();
        break;
      case "custom":
        return this.deleteOneSymbolCustom();
        break;
      case "date":
        return this.deleteOneSymbolDate();
        break;
      case "email":
        return this.deleteOneSymbolEmail();
        break;
      case "inn":
        return this.deleteOneSymbolInn();
        break;
      case "kpp":
        return this.deleteOneSymbolKpp();
        break;
      case "money":
        return this.deleteOneSymbolMoney();
        break;
      case "phone":
        return this.deleteOneSymbolPhone();
        break;
      case "rs":
        return this.deleteOneSymbolRs();
        break;
      default:
        console.log("default");
    }
    return;
  }

  //  удаление одного символа у БИК
  private deleteOneSymbolBik(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.clearString;
  }

  //  удаление одного символа у кастом маски
  private deleteOneSymbolCustom(): string {
    //  удаляем последний символ из чистой строки
    this.clearString = this.clearString.substring(0, this.clearString.length - 1);
    //  уменьшаем текущий указатель на последний символ
    this.customCharIndex--;
    //  заново строим строку
    return this.buildCustomString(this.clearString);
  }

  //  удаление одного символа у даты
  private deleteOneSymbolDate(): string {
    const size = this.currentValue.length;
    const tempArray = [...this.currentValue];
    if (tempArray[size-1] && tempArray[size-1] === '.') {
      tempArray.splice(tempArray.length - 2, 2);
      console.log('with .', this.currentValue, tempArray);
      this.currentValue = tempArray.join('');
    } else {
      tempArray.splice(tempArray.length - 1, 1);
      this.currentValue = tempArray.join('');
      console.log('without .', this.currentValue, tempArray);
    }
    return this.currentValue;
  }

  //  удаление одного символа у электронной почты
  private deleteOneSymbolEmail(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.clearString;
  }

  //  удаление одного символа у ИНН
  private deleteOneSymbolInn(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.clearString;
  }

  //  удаление одного символа у КПП
  private deleteOneSymbolKpp(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.clearString;
  }

  //  удаление одного символа у денег
  private deleteOneSymbolMoney(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.buildMoneyString(this.buildMoneyChunks(this.clearString));
  }

  //  удаление одного символа у телефона
  private deleteOneSymbolPhone(): string {

    //  удаляем последний символ из чистой строки
    this.clearString = this.clearString.substring(0, this.clearString.length - 1);
    //  уменьшаем текущий указатель на последний символ
    this.customCharIndex--;
    //  заново строим строку
    return this.buildPhoneString(this.clearString);
  }

  //  удаление одного символа у Р/С
  private deleteOneSymbolRs(): string {

    if ( this.clearString.length > 0 ) {
      const tempArray = [...this.clearString];
      tempArray.splice(tempArray.length - 1, 1);
      this.clearString = tempArray.join('');
      this.customCharIndex--;
      console.log('without', this.clearString, tempArray);
    }

    return this.clearString;
  }

  //  проверка является ли числом
  private isCharDigit(dirtyChar): boolean {
    if (dirtyChar === '1' ||
      dirtyChar === '2' ||
      dirtyChar === '3' ||
      dirtyChar === '4' ||
      dirtyChar === '5' ||
      dirtyChar === '6' ||
      dirtyChar === '7' ||
      dirtyChar === '8' ||
      dirtyChar === '9' ||
      dirtyChar === '0') {
      return true
    } else {
      return false
    }
  }

  //  проверка является ли буквой
  private isLetter(dirtyChar): boolean {
    if (dirtyChar.toUpperCase() != dirtyChar.toLowerCase() || dirtyChar.codePointAt(0) > 127) {
      return true
    }
    return false;
  }

  //  проверка является ли буквой
  private isEmailSymbol(dirtyChar): boolean {
    const regExp = new RegExp("[a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~(),:;<>@]");
    if (regExp.test(dirtyChar) && dirtyChar.length === 1) {
      return true
    }
    return false;
  }

  //  проверка для символов разделителей рублей и копеек
  private isFillerMoneySymbol(symbol: string): boolean {
    //  основные проверки на символы и интервалы
    if (
      (symbol === '.') ||
      (symbol === ',') ||
      (symbol === '.') ||
      (symbol === ',')
    ) {
      return true;
    }
    return false;
  }

  //  проверка входит ли в диапазон
  private inRange(dirtyChar: string, range: string): boolean {
    const firstDigit = Number(range.substring(0, 1));
    const secondDigit = Number(range.substring(3, 4));
    const dirtyNum = Number(dirtyChar);

    return ((firstDigit < secondDigit) && (dirtyNum >= firstDigit && dirtyNum <= secondDigit))
      || ((firstDigit > secondDigit) && (dirtyNum <= firstDigit && dirtyNum >= secondDigit));


  }

  //  нормализация для БИК
  private bikNormalize(lastPressedKey: string): string {
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (isNumeric(lastPressedKey) && this.clearString.length <= 8) {
      this.clearString += lastPressedKey;
      this.customCharIndex++;
    } else {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('bik', 'Isn\'t digit or more then 9 digits'));
    }

    return this.clearString;
  }

  //  нормализация для электронной почты
  private emailNormalize(lastPressedKey: string): string{
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (this.isEmailSymbol(lastPressedKey)) {
      const emailChunks = this.clearString.split("@");
      //  попытка ввести еще одну собачку
      if (lastPressedKey === "@" && emailChunks.length >= 2) {
        this.el.nativeElement.dispatchEvent(this.createCustomEvent('email', 'Only one @ permitted'));
        return this.clearString
      } else {
        if (emailChunks[0].length > 63) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('email', 'Username can\'t be more then 64 symbols'));
          return this.clearString
        }
        if (emailChunks.length === 2 && emailChunks[0].length > 254) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('email', 'Domain name can\'t be more then 255 symbols'));
          return this.clearString
        }
        if (this.clearString.length > 255) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('email', 'Email can\'t be more then 256 symbols'));
          return this.clearString
        }

        this.clearString += lastPressedKey;
        this.customCharIndex++;

        //  валидация итогового значения email - если не бьется - кидаем ивент наверх
        if (!this.validateEmail(this.clearString)) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('email', 'Email is invalid'));
        }

      }
    }

    return this.clearString;
  }

  //  нормализация для ИНН
  private innNormalize(lastPressedKey: string): string {
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (isNumeric(this.lastKeyPress) && this.clearString.length < 12) {
      this.clearString += this.lastKeyPress;
      this.customCharIndex++;
      this.validateInn(this.clearString);
    } else {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('inn', 'More then 12 digit or isn\'t digit'));
    }

    return this.clearString;
  }

  //  нормализация для КПП
  private kppNormalize(lastPressedKey: string): string {
    if (lastPressedKey.length !== 1) {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('kpp', 'Only alphabet or digit'));
      return this.clearString;
    } else if (this.clearString.length > 8) {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('kpp', 'Cant be more then 9 symbols'));
      return this.clearString;
    }

    if (RegExp("[a-z]").test(lastPressedKey)) {
      lastPressedKey = lastPressedKey.toUpperCase();
    }
     //  проверяем если введена цифра - то добавляем в чистую выборку
    if ((isNumeric(lastPressedKey) && (this.clearString.length < 4 || this.clearString.length > 5)) ||
      ((RegExp("[A-Z0-9]").test(lastPressedKey)) && (this.clearString.length >= 4 && this.clearString.length <= 5))) {

      this.clearString += lastPressedKey;
      this.customCharIndex++;
    } else {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('inn', 'Isnt digit (or alfabet for 5,6 symbol)'));
    }

    //  валидация итогового значения КПП - если не бьется - кидаем ивент наверх
    // if (this.clearString.length === 9 && !this.validateKpp(this.clearString)) {
    //   this.el.nativeElement.dispatchEvent(this.createCustomEvent('kpp', 'KPP is invalid'));
    // }

    return this.clearString;
  }

  //  нормализация для денег
  private moneyNormalize(lastPressedKey: string): string {
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (isNumeric(lastPressedKey) || this.isFillerMoneySymbol(lastPressedKey)) {

      //  дробим строку на две половины
      let chunks: string[] = this.buildMoneyChunks(this.clearString);
      console.log('chunk 711: ',chunks)
      // проверяем на второй разделитель
      if (
        this.clearString.indexOf('.') !== -1 ||
        this.clearString.indexOf(',') !== -1 ||
        this.clearString.indexOf('.') !== -1 ||
        this.clearString.indexOf(',') !== -1
      ) {

        //  проверяем что прилетел не еще один разделитель
        if (this.isFillerMoneySymbol(lastPressedKey)) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('money', 'Cant be more then 1 filler'));
          return this.buildMoneyString([this.clearString]);
        }

        //  проверка что копеек не больше двух символов
        if (chunks[1] && chunks[1].length > 1) {
          this.el.nativeElement.dispatchEvent(this.createCustomEvent('money', 'Part after filler cant be more then 2 digits'));
          return this.buildMoneyString(chunks);
        }

        this.clearString += lastPressedKey;
        this.customCharIndex++;
        // return this.buildMoneyString(chunks);
      } else {
        //  разделителя еще нет
        this.clearString += lastPressedKey;
        //  дробим строку на две половины
        chunks = this.buildMoneyChunks(this.clearString);

        this.customCharIndex++;
        return this.buildMoneyString(chunks);
      }

    }

    // return this.buildMoneyString(chunks);
    return this.buildMoneyString([this.clearString]);
  }

  //  нормализация для телефона
  private phoneNormalize(dirtyPhone: string): string {
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (isNumeric(this.lastKeyPress)) {
      this.clearString += this.lastKeyPress;
      this.customCharIndex++;
    }

    // let dirtyArray = [...dirtyPhone];
    return this.buildPhoneString(this.clearString);
  }

  //  нормализация для расчетного счета
  private rsNormalize(lastPressedKey: string): string {
    const bik = String(this.maskOptions);
    if (!this.validateBik(bik)) {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('rs', 'BIK field is empty'));
    }
    //  проверяем если введена цифра - то добавляем в чистую выборку
    if (isNumeric(lastPressedKey) && this.clearString.length < 20) {
      this.clearString += lastPressedKey;
      this.customCharIndex++;
    } else {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('rs', 'More then 20 digit or isn\'t digit'));
    }

    //  валидация итогового значения РС - если не бьется - кидаем ивент наверх
    if( this.clearString.length === 20 && !this.validateRs(this.clearString, bik)  ) {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('rs', 'RS is invalid'));
    }

    return this.clearString;
  }

  //  парсинг маски в два массива
  private prepareCustomMask(customMaskOption: string) {
    //  накопитель для заполнителя
    let accFiller: string = '';

    const maskArray = [...customMaskOption];

    while (maskArray.length) {
      if (maskArray[0] === '/') {
        //  если попался заполнитель - кидаем его в акк и удаляем из массива
        accFiller += maskArray[1];
        maskArray.splice(0, 2);
      } else if (maskArray[0] === '[') {
        //  если попался фильтр - кидаем его в массив и удаляем из массива + копируем акк в массив филлеров и обнуляем
        this.fillerFilterArray.push(accFiller);
        accFiller = '';
        const charIndex = maskArray.findIndex(char => char === ']');
        this.dataFilterArray.push((maskArray.slice(1, charIndex)).join(''));
        maskArray.splice(0, charIndex + 1);
      }
    }
  }

  //  проверка на попадание в фильтр
  private testSymbol(symbol: string): boolean {
    //  основные проверки на символы и интервалы
    if (
      (isNumeric(symbol) && this.dataFilterArray[this.customCharIndex] === 'D') ||
      (this.isLetter(symbol) && this.dataFilterArray[this.customCharIndex] === 'A') ||
      (isNumeric(symbol) && this.inRange(symbol, this.dataFilterArray[this.customCharIndex])) ||
      ((this.isLetter(symbol) || isNumeric(symbol)) && this.dataFilterArray[this.customCharIndex] === 'AD') ||
      ((this.isLetter(symbol) || isNumeric(symbol)) && this.dataFilterArray[this.customCharIndex] === 'DA')
    ) {
      return true;
    }
    return false;
  }

  // Функция для проверки правильности БИК
  private validateBik(bik): boolean {
    var result = false;
    if (typeof bik === 'number') {
      bik = bik.toString();
    } else if (typeof bik !== 'string') {
      bik = '';
    }
    if (!bik.length) {
      // error.code = 1;
      // error.message = 'БИК пуст';
    } else if (/[^0-9]/.test(bik)) {
      // error.code = 2;
      // error.message = 'БИК может состоять только из цифр';
    } else if (bik.length !== 9) {
      // error.code = 3;
      // error.message = 'БИК может состоять только из 9 цифр';
    } else {
      result = true;
    }
    return result;
  }

  private validateEmail(email) {
      const pattern  = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return pattern.test(email);
  }

  // Функция для проверки правильности ИНН
  private validateInn(inn): boolean {
    let result = false;
    if (typeof inn === 'number') {
      inn = inn.toString();
    } else if (typeof inn !== 'string') {
      inn = '';
    }
    if ([10, 12].indexOf(inn.length) === -1) {
      this.el.nativeElement.dispatchEvent(this.createCustomEvent('inn', 'ИНН может состоять только из 10 или 12 цифр'));
      // error.code = 3;
      // error.message = 'ИНН может состоять только из 10 или 12 цифр';
    } else {
      const checkDigit = (inn, coefficients) => {
        let n = 0;
        for (let i in coefficients) {
          n += coefficients[i] * inn[i];
        }
        return parseInt(String(n % 11 % 10));
      };
      switch (inn.length) {
        case 10:
          let n10 = checkDigit(inn, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
          if (n10 === parseInt(inn[9])) {
            result = true;
          }
          break;
        case 12:
          let n11 = checkDigit(inn, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
          let n12 = checkDigit(inn, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
          if ((n11 === parseInt(inn[10])) && (n12 === parseInt(inn[11]))) {
            result = true;
          }
          break;
      }
      if (!result) {
        this.el.nativeElement.dispatchEvent(this.createCustomEvent('inn', 'У ИНН неверная контрольная сумма'));

      }
    }
    return result;
  }

  // Функция для проверки правильности расчетного счета
  private validateRs(rs, bik) {
    var result = false;
    if (this.validateBik(bik)) {
      if (typeof rs === 'number') {
        rs = rs.toString();
      } else if (typeof rs !== 'string') {
        rs = '';
      }
      if (!rs.length) {
        // error.code = 1;
        // error.message = 'Р/С пуст';
      } else if (/[^0-9]/.test(rs)) {
        // error.code = 2;
        // error.message = 'Р/С может состоять только из цифр';
      } else if (rs.length !== 20) {
        // error.code = 3;
        // error.message = 'Р/С может состоять только из 20 цифр';
      } else {
        var bikRs = bik.toString().slice(-3) + rs;
        var checksum = 0;
        var coefficients = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1];
        for (var i in coefficients) {
          checksum += coefficients[i] * (bikRs[i] % 10);
        }
        if (checksum % 10 === 0) {
          result = true;
        }
      }
    }
    return result;
  }

  //
  // function validateKs(ks, bik, error) {
  //   var result = false;
  //   if (validateBik(bik, error)) {
  //     if (typeof ks === 'number') {
  //       ks = ks.toString();
  //     } else if (typeof ks !== 'string') {
  //       ks = '';
  //     }
  //     if (!ks.length) {
  //       error.code = 1;
  //       error.message = 'К/С пуст';
  //     } else if (/[^0-9]/.test(ks)) {
  //       error.code = 2;
  //       error.message = 'К/С может состоять только из цифр';
  //     } else if (ks.length !== 20) {
  //       error.code = 3;
  //       error.message = 'К/С может состоять только из 20 цифр';
  //     } else {
  //       var bikKs = '0' + bik.toString().slice(4, 6) + ks;
  //       var checksum = 0;
  //       var coefficients = [7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1];
  //       for (var i in coefficients) {
  //         checksum += coefficients[i] * (bikKs[i] % 10);
  //       }
  //       if (checksum % 10 === 0) {
  //         result = true;
  //       } else {
  //         error.code = 4;
  //         error.message = 'Неправильное контрольное число';
  //       }
  //     }
  //   }
  //   return result;
  // }
  //
  // function validateOgrn(ogrn, error) {
  //   var result = false;
  //   if (typeof ogrn === 'number') {
  //     ogrn = ogrn.toString();
  //   } else if (typeof ogrn !== 'string') {
  //     ogrn = '';
  //   }
  //   if (!ogrn.length) {
  //     error.code = 1;
  //     error.message = 'ОГРН пуст';
  //   } else if (/[^0-9]/.test(ogrn)) {
  //     error.code = 2;
  //     error.message = 'ОГРН может состоять только из цифр';
  //   } else if (ogrn.length !== 13) {
  //     error.code = 3;
  //     error.message = 'ОГРН может состоять только из 13 цифр';
  //   } else {
  //     var n13 = parseInt((parseInt(ogrn.slice(0, -1)) % 11).toString().slice(-1));
  //     if (n13 === parseInt(ogrn[12])) {
  //       result = true;
  //     } else {
  //       error.code = 4;
  //       error.message = 'Неправильное контрольное число';
  //     }
  //   }
  //   return result;
  // }
  //
  // function validateOgrnip(ogrnip, error) {
  //   var result = false;
  //   if (typeof ogrnip === 'number') {
  //     ogrnip = ogrnip.toString();
  //   } else if (typeof ogrnip !== 'string') {
  //     ogrnip = '';
  //   }
  //   if (!ogrnip.length) {
  //     error.code = 1;
  //     error.message = 'ОГРНИП пуст';
  //   } else if (/[^0-9]/.test(ogrnip)) {
  //     error.code = 2;
  //     error.message = 'ОГРНИП может состоять только из цифр';
  //   } else if (ogrnip.length !== 15) {
  //     error.code = 3;
  //     error.message = 'ОГРНИП может состоять только из 15 цифр';
  //   } else {
  //     var n15 = parseInt((parseInt(ogrnip.slice(0, -1)) % 13).toString().slice(-1));
  //     if (n15 === parseInt(ogrnip[14])) {
  //       result = true;
  //     } else {
  //       error.code = 4;
  //       error.message = 'Неправильное контрольное число';
  //     }
  //   }
  //   return result;
  // }
  //
  //
  // function validateSnils(snils, error) {
  //   var result = false;
  //   if (typeof snils === 'number') {
  //     snils = snils.toString();
  //   } else if (typeof snils !== 'string') {
  //     snils = '';
  //   }
  //   if (!snils.length) {
  //     error.code = 1;
  //     error.message = 'СНИЛС пуст';
  //   } else if (/[^0-9]/.test(snils)) {
  //     error.code = 2;
  //     error.message = 'СНИЛС может состоять только из цифр';
  //   } else if (snils.length !== 11) {
  //     error.code = 3;
  //     error.message = 'СНИЛС может состоять только из 11 цифр';
  //   } else {
  //     var sum = 0;
  //     for (var i = 0; i < 9; i++) {
  //       sum += parseInt(snils[i]) * (9 - i);
  //     }
  //     var checkDigit = 0;
  //     if (sum < 100) {
  //       checkDigit = sum;
  //     } else if (sum > 101) {
  //       checkDigit = parseInt(sum % 101);
  //       if (checkDigit === 100) {
  //         checkDigit = 0;
  //       }
  //     }
  //     if (checkDigit === parseInt(snils.slice(-2))) {
  //       result = true;
  //     } else {
  //       error.code = 4;
  //       error.message = 'Неправильное контрольное число';
  //     }
  //   }
  //   return result;
  // }

}


