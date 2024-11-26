import { Controller, Delete, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return [];
  }

  @Get()
  getMovie() {
    return {
      id: 'id', 
      name: '해리포터', 
      character: ['해리포터', '엠마왓슨']
    }
  }

  @Post()
  postMovie() {
    return {
      id: 3,
      name:'어벤젓',
      character: ['아이언맨', '캡틴아메리타']
    }
  }

  @Delete()
  deleteMovie(){
    return 3;
  }
}
