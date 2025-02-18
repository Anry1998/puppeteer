import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ParserService } from './parser/parser.service';
import { ParserController } from './parser/parser.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    HttpModule
  ],
  controllers: [ParserController],
  providers: [AppService, ParserService],
})
export class AppModule {}
