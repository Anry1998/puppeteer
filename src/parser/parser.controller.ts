import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('pars')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Get()
  async login() {
    const res = await this.parserService.mainLaunch();

    return res
  }

  // @Post()
  // async hcaptcha() {
  //   return await this.parserService.curl();
  // }
}
