import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DateTime } from 'luxon';
import { IEvent } from 'src/app/interfaces/event.interface';
import { ISpiritTree } from 'src/app/interfaces/spirit-tree.interface';
import { ISpirit } from 'src/app/interfaces/spirit.interface';
import { SpiritTypePipe } from 'src/app/pipes/spirit-type.pipe';
import { DataService } from 'src/app/services/data.service';
import { TitleService } from 'src/app/services/title.service';

interface ITree {
  date?: DateTime;
  name: string;
  tree: ISpiritTree;
}

@Component({
  selector: 'app-spirit',
  templateUrl: './spirit.component.html',
  styleUrls: ['./spirit.component.less']
})
export class SpiritComponent {
  spirit!: ISpirit;
  trees: Array<ITree> = [];
  seasonTree?: ISpiritTree;
  typeName?: string;
  event?: IEvent;

  highlightTree?: string;
  highlightItem?: string;

  constructor(
    private readonly _dataService: DataService,
    private readonly _titleService: TitleService,
    private readonly _route: ActivatedRoute
  ) {
    _route.queryParamMap.subscribe(p => this.onQueryChanged(p));
    _route.paramMap.subscribe(p => this.onParamsChanged(p));
  }

  onQueryChanged(p: ParamMap): void {
    this.highlightTree = p.get('highlightTree') || undefined;
    this.highlightItem = p.get('highlightItem') || undefined;
  }

  onParamsChanged(params: ParamMap): void {
    const guid = params.get('guid');
    this.spirit = this._dataService.guidMap.get(guid!) as ISpirit;
    this._titleService.setTitle(this.spirit.name || 'Spirit');
    this.typeName = new SpiritTypePipe().transform(this.spirit.type);

    this.event = this.spirit?.events?.at(-1)?.eventInstance?.event;

    this.trees = [];

    // Sort TS and returns by date.
    const ts = (this.spirit.ts || []).map(ts => {
      return {
        date: ts.date,
        name: 'Traveling Spirit #' + ts.number,
        tree: ts.tree
      };
    });

    const visits = (this.spirit.returns || []).map((v, vi) => {
      return {
        date: v.return.date,
        name: v.return.name || 'Visit #' + (vi+1),
        tree: v.tree
      };
    });

    const sortedTrees = ts.concat(visits);
    sortedTrees.sort((a, b) => b.date.diff(a.date).as('milliseconds'));

    this.trees = sortedTrees;
    if (this.spirit.tree) {
      this.trees.push({ name: 'Spirit tree', tree: this.spirit.tree });
      if (this.spirit.type === 'Season' || this.spirit.type === 'Guide') {
        this.seasonTree = this.spirit.tree;
      }
    }
  }
}
