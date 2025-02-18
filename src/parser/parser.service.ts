import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import puppeteer from 'puppeteer-extra';

// import { AxiosError, AxiosResponse } from 'axios';
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { executablePath } = require('puppeteer'); 

// const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
// import * as puppeteer from 'puppeteer';
// import * as select from 'puppeteer-select';

// const puppeteerExtra = require('puppeteer-extra');
// const Stealth = require('puppeteer-extra-plugin-stealth');

// puppeteerExtra.use(Stealth());

// Set up the plugin
// puppeteer.use(
//   RecaptchaPlugin({
//     provider: {
//       id: '2captcha',
//       token: '84ddcb03c86e3ff518cc8c2e3b3975a3',
//     },
//     visualFeedback: true,
//   })
// );

@Injectable()
export class ParserService {

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {} 

  async mainСonnect() {
    // браузер должен быть открыт на порту 9222 либо изменить URL http://localhost:9222/json/version

    const url = this.configService.get<string>('SITE_URL')

    // Получаю текущее ws соединение браузера 
    const {data}  = await firstValueFrom(
      this.httpService.get('http://localhost:9222/json/version').pipe(),
    );
    const wsDebuggerUrl = data.webSocketDebuggerUrl

    const browser = await puppeteer.connect({
      browserWSEndpoint: wsDebuggerUrl,
      // Оставить стандартный Viewport
      defaultViewport: null,
    });

    const pages = await browser.pages();

    // Нахожу открытую страницу по URL.
    const page = pages.find(page => page.url() === url)

    // если нет логина, раскомментировать код ниже

    // Нахожу первую кнопку войти и кликаю на нее (на странице входа их две)
    await page.$$eval('button', (buttons: any) => {
      const result = buttons.filter((button: any) => button.textContent === 'Войти');
      result[0].click();
    }); 
 
    // Нахожу и заполненяю input
    await page.locator('[placeholder="Электронная почта / Номер телефона"]').fill(this.configService.get<string>('LOGIN'));
    await page.locator('[placeholder="Пароль"]').fill(this.configService.get<string>('PASSWORD'));

    // Нахожу вторую кнопку войти и кликаю на нее
    await page.$$eval('button', (buttons: any) => {
      const result = buttons.filter((button: any) => button.textContent === 'Войти');
      result[1].click();
    }); 

    // Может попросить пройти capcha

    // await browser.disconnect();
  }  

  async mainLaunch() {

    const url = this.configService.get<string>('SITE_URL')

    const options = { 
      headless: Boolean(this.configService.get<string>('HEADLESS') === "true"),
      ignoreHTTPSErrors: Boolean(this.configService.get<string>('IGNORE_HTTPS_ERRORS') === "yes"),
      args : [
        `--proxy-server=${this.configService.get<number>('BK_PROXY_HOST')}:${this.configService.get<number>('BK_PROXY_PORT')}`,
        `--ignore-certificate-errors`,
        `--window-size=${this.configService.get<number>('BK_VIEWPORT')}`,
        // Устанавливаю язык браузера
        `--lang=bn-BD,bn`,
      ],
    };  

    const browser = await puppeteer.launch(options);
    
    const page = await browser.newPage();  
    await page.authenticate({
      username: this.configService.get<string>('BK_PROXY_AUTH_USERNAME'), 
      password: this.configService.get<string>('BK_PROXY_AUTH_PASSWORD')
    });

    await page.setUserAgent(this.configService.get<string>('BK_UA'))

    await page.goto(url);  

    // Найти и нажать кнопку с текстом
    await page.$$eval('button', buttons => {
      for (const button of buttons) {
        if (button.textContent === 'Sign In') {
          button.click();
          break; // Нажимаем первую подходящую кнопку и выходим из цикла
        }
      }
    });

    // Найти и заполнить инпут
    await page.locator('[placeholder="Email / Phone Number"]').fill(this.configService.get<string>('LOGIN'));
    await page.locator('[placeholder="Password"]').fill(this.configService.get<string>('PASSWORD'));

    // Нужно пройти capcha

    await browser.close();
  }

  // async connect() {
  //   // http://127.0.0.1:9222/json/version

  //   const res = await fetch("http://localhost:9222/json/version");
  //   const data = await res.json();
  //   const wsDebuggerUrl = data.webSocketDebuggerUrl
  //   console.log('wsDebuggerUrl: ', wsDebuggerUrl)

  //   const url = 'https://bc.game'

  //   puppeteer.use(StealthPlugin())

  //   const browser = await puppeteer.connect({
  //     // browserWSEndpoint: wsDebuggerUrl,
  //     // headless: false,
  //     browserURL: "http://localhost:9222",
  //     defaultViewport: null,
  //   });

  //   const pages = await browser.pages();

  //   console.log('pages: ', pages);

  //   // const page = pages.find(
  //   //   page => page.url() === url // Если нужно найти вкладку по URL.
  //   // ) || pages[0]; // Если нужна просто одна открытая вкладка.

  //   const page = pages[0]; // Если нужна просто одна открытая вкладка.

  //   const buttonSecond = 'div.sm:w-[16.5rem]';
  //   await page.waitForSelector(buttonSecond);
  //   await page.click(buttonSecond);

 


  //   // await page.authenticate({username: '', password: ''} );
  //   // // await page.setUserAgent(
  //   // //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  //   // // );
  //   // // await page.waitForNetworkIdle() // Дождитесь полной загрузки сетевых ресурсов
  //   // await page.goto(url);

  //   // const buttonSecond = 'button.bg-black_alpha5';
  //   // await page.waitForSelector(buttonSecond);
  //   // await page.click(buttonSecond);

  //   // // await page.$$eval('button', buttons => {
  //   // //   for (const button of buttons) {
  //   // //     if (button.textContent === '0,00 ₹') {
  //   // //       const fullTitle =  button?.evaluate(el => el.textContent);
  //   // //       console.log('The title of this blog post is "%s".', fullTitle);
  //   // //       break;
  //   // //     }
  //   // //   }
  //   // // });

  //   // const textSelector = await page.waitForSelector('div.px-2 > span.text-base')
  //   // const fullTitle = await textSelector?.evaluate(el => el.textContent);
  //   // console.log('Text', fullTitle);

  //   // return fullTitle

  //   // console.log(image);

  //   // await page.locator('[placeholder="Электронная почта / Номер телефона"]').fill(this.configService.get<string>('LOGIN'));
  //   // await page.locator('[placeholder="Пароль"]').fill(this.configService.get<string>('PASSWORD'));

  //   // await page.$$eval('button', buttons => {
  //   //   for (const button of buttons) {
  //   //     if (button.textContent === 'Войти') {
  //   //       button.click();
  //   //       break;
  //   //     }
  //   //   }
  //   // });

  // }




  // async getRating(url: string) {

  //   let launchOptions = { 
  //     executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  //     headless: false,
  //     args: [
  //       '--user-data-dir=/Users/username/some/folder/user'
  //     ]
  //   }

  //   const browser = await puppeteer.launch(launchOptions)
  //   const page = await browser.newPage();

  //   await page.goto(url);

  //   console.log(await page.content());

    
  //   await browser.close();

  //   return await page.content()
  // }
  // async curl() {
  //   // this.httpService.post('http://2captcha.com/in.php', {
  //   //     key: 'dde6dc49eba9f59e5dee3e0c5e363823',
  //   //     method: 'hcaptcha',
  //   //     sitekey: 'cf0b9a27-82e3-42fb-bfec-562f8045e495',
  //   //     pageurl: 'https://bc.game/login/signin',
  //   // })

  //   // cf0b9a27-82e3-42fb-bfec-562f8045e495
  //   const { data } = await firstValueFrom(
  //     this.httpService.post('http://2captcha.com/in.php', {
  //       key: 'dde6dc49eba9f59e5dee3e0c5e363823',
  //       method: 'hcaptcha',
  //       sitekey: 'cf0b9a27-82e3-42fb-bfec-562f8045e495',
  //       pageurl: 'https://bc.game/login/signin',
  //     }).pipe(
  //       catchError((error: AxiosError) => {
  //         console.log(error.response.data)
  //         throw 'An error happened!';
  //       }),
  //     ),
  //   );
  //   console.log(data.substring(data.indexOf("|") + 1))

  //   // http://2captcha.com/res.php?key=dde6dc49eba9f59e5dee3e0c5e363823&action=get&id=78750046973
  //   const rrr = await firstValueFrom(
  //     this.httpService.get(`http://2captcha.com/res.php?key=dde6dc49eba9f59e5dee3e0c5e363823&action=get&id=${data.substring(data.indexOf("|") + 1)}`).pipe(
  //       catchError((error: AxiosError) => {
  //         console.log(error.response.data)
  //         throw 'An error happened!';
  //       }),
  //     ),
  //   );

  //   return rrr.data;



  //   // const response = await fetch("http://2captcha.com/in.php", {
  //   //   method: 'POST',
  //   //   body: JSON.stringify({
  //   //     key: 'dde6dc49eba9f59e5dee3e0c5e363823',
  //   //     method: 'hcaptcha',
  //   //     sitekey: 'cf0b9a27-82e3-42fb-bfec-562f8045e495',
  //   //     pageurl: 'https://bc.game/login/signin',
  //   //   })
  //   // })
  //   // console.log(response)
  //   // return response.body

  // }

  // async login() {

  //   (async () => {
  //     const pathToExtension = require('path').join(__dirname, '2captcha-solver');
  //     console.log('pathToExtension: ', pathToExtension)
  //     puppeteer.use(StealthPlugin()) 
  //     const browser = await puppeteer.launch({
  //       headless: false,
  //       args: [
  //         `--disable-extensions-except=${pathToExtension}`,
  //         `--load-extension=${pathToExtension}`,
  //       ],
  //       executablePath: executablePath() 
  //     });

  //     const [page] = await browser.pages()
  //     // переходим по указанному адресу
  //     await page.goto('https://2captcha.com/demo/recaptcha-v2') 

  //     // ждем пока появится элемент с CSS селектором ".captcha-solver"
  //     await page.waitForSelector('.captcha-solver')
  //     // кликаем по элементу с указанным селектором
  //     await page.click('.captcha-solver')

  //     //  По умолчанию waitForSelector ожидает в течение 30 секунд, но этого времени обычно не достаточно, поэтому указываем значение timeout вручную вторым параметром. Значение timeout указывается в "ms".
  //     await page.waitForSelector(`.captcha-solver[data-state="solved"]`, {timeout: 180000})

  //     // После решения капчи выполняем необходимые действия, в нашем случае нажимаем на кнопку  "Check", для проверки решения.
  //     await page.click("button[type='submit']")
  //   })();
 
  // }


  // async login3() {
  //   // puppeteer.use(StealthPlugin()) 

  //   const url = 'https://bc.game'  

  //   const options = {
  //     headless: Boolean(this.configService.get<string>('HEADLESS') === "true") ,
  //     args : [
  //       `--proxy-server=${this.configService.get<number>('BK_PROXY_HOST')}:${this.configService.get<number>('BK_PROXY_PORT')}`,
  //        `--ignore-certificate-errors`,
  //     ],
  //   };  

  //   const browser = await puppeteer.launch(options);

  //   // const browser = await puppeteer.content(options)
    
  //   const page = await browser.newPage(); 
  //   await page.authenticate({
  //     username: this.configService.get<number>('BK_PROXY_AUTH_USERNAME'), 
  //     password: this.configService.get<number>('BK_PROXY_AUTH_PASSWORD')
  //   });

  //   // page.on('console', msg => console.log(msg.text()));

    

  //   // const navigationPromise = page.waitForNavigation({waitUntil: "domcontentloaded"})

  //   await page.setUserAgent(
  //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  //   );

    
  //   await page.goto(url);  

  //   // const buttonSecond = '.button-second';
  //   // await page.waitForSelector(buttonSecond);
  //   // await page.click(buttonSecond);

  //   // const {solver, error} = await page.solveRecaptchas()
  //   // if(solver) {
  //   //   console.log('Капча пройдена')
  //   // }
    
  //   // await page.setViewport({width: 1080, height: 1024});

  //   // const overlayer = 'div.overlayer';
  //   // await page.waitForSelector(overlayer);

  //   // // await page.evaluate(() => {
  //   // //   (document.querySelectorAll('div.overlayer') || []).forEach(el=>el.remove())
  //   // // }) 

  //   // await page.evaluate(() => {
  //   //   (document.querySelector('div.overlayer')).remove()
  //   // }) 


  //   // Найдите и нажмите кнопку с текстом "Узнать больше"
  //   await page.$$eval('button', buttons => {
  //     for (const button of buttons) {
  //       if (button.textContent === 'Sign In') {
  //         button.click();
  //         break; // Нажимаем первую подходящую кнопку и выходим из цикла
  //       }
  //     }
  //   });

  //   // await page.$$eval('input', el => {
  //   //   for (const input of el) {
  //   //     if (input.ariaPlaceholder === 'Электронная почта / Номер телефона') {
  //   //       console.log('Плейсхолдер найден');
  //   //       break; // Нажимаем первую подходящую кнопку и выходим из цикла
  //   //     }
  //   //   }
  //   // });

  //   await page.locator('[placeholder="Email / Phone Number"]').fill(this.configService.get<string>('LOGIN'));
  //   await page.locator('[placeholder="Password"]').fill(this.configService.get<string>('PASSWORD'));

  //   await page.$$eval('button', buttons => {
  //     for (const button of buttons) {
  //       if (button.textContent === 'Sign In') {
  //         console.log('Sign In')
  //         button.click(); 
  //         break; // Нажимаем первую подходящую кнопку и выходим из цикла
  //       }
  //     }
  //   });

  //   // button button-brand button-m w-full mt-6


  //   // const overlayer = 'div.overlayer';
  //   // await page.waitForSelector(overlayer);



  //   // const fullTitle = await textSelector?.evaluate(el => el.textContent);

  //   // console.log('The title of this blog post is "%s".', fullTitle);

  //   // await navigationPromise;


    



  //   // const searchResultSelector = 'a.i-auth__open-login-tab';
  //   // await page.waitForSelector(searchResultSelector);
  //   // const btn = await page.click(searchResultSelector);

  //   // await page.locator('input.qa-auth-form-field-login').fill(this.configService.get<string>('LOGIN'));
  //   // await page.locator('input.auth-form__password').fill(this.configService.get<string>('PASSWORD'));

  //   // await page.click('button.auth-form__submit-button');
  // }

  // async login2() {
  //   const url = 'https://www.reg.ru'
  //   const options = {
  //     headless: false,
  //   };

  //   const browser = await puppeteer.launch(options);
    
  //   const page = await browser.newPage(); 
 
  //   await page.goto(url); 
  //   await page.setViewport({width: 1080, height: 1024});

  //   const textSelector = await page.waitForSelector('h2.u-domain-selection__title')
  //   const fullTitle = await textSelector?.evaluate(el => el.textContent);
  //   console.log('The title of this blog post is "%s".', fullTitle);
  //   await browser.close();

  //   // const textSelector = 'h2.u-domain-selection__title';
  //   // await page.waitForSelector('h2.u-domain-selection__title');
  //   // const fullTitle = await textSelector?.evaluate(el => el.textContent);



    
  // }
} 
