import { Component, OnInit } from '@angular/core';
import { ISeason } from 'src/app/interfaces/season.interface';
import { SpiritType } from 'src/app/interfaces/spirit.interface';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-seasons',
  templateUrl: './seasons.component.html',
  styleUrls: ['./seasons.component.less']
})
export class SeasonsComponent implements OnInit {
  seasons!: Array<ISeason>;
  reverseSeasons!: Array<ISeason>;

  years: Array<number> = [];
  yearMap!: { [year: number]: Array<ISeason> };
  spiritCount!: { [key: string]: number };


  constructor(
    private readonly _dataService: DataService
  ) {
    this.seasons = _dataService.seasonConfig.items;
    this.reverseSeasons = this.seasons.slice().reverse();
  }

  ngOnInit(): void {
    let year = this.seasons.at(-1)!.year + 1;
    this.yearMap = {};
    this.spiritCount = {};
    for (let i = this.seasons.length -1; i >= 0; i--) {
      const season = this.seasons[i];
      if (season.year < year) {
        year = season.year;
        this.years.push(year);
        this.yearMap[year] = [];
      }

      this.yearMap[year].push(season);
      this.spiritCount[season.guid] = season.spirits.filter(s => s.type === 'Season').length;
    }
  }
}
