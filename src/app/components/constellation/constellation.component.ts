import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { filter, SubscriptionLike } from 'rxjs';
import { CostHelper } from 'src/app/helpers/cost-helper';
import { IConstellation } from 'src/app/interfaces/constellation.interface';
import { ICost } from 'src/app/interfaces/cost.interface';
import { IItem } from 'src/app/interfaces/item.interface';
import { INode } from 'src/app/interfaces/node.interface';
import { EventService } from 'src/app/services/event.service';

@Component({
  selector: 'app-constellation',
  templateUrl: './constellation.component.html',
  styleUrls: ['./constellation.component.less']
})
export class ConstellationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() constellation!: IConstellation;
  @Input() name?: string;

  nodes: Array<INode> = [];
  left: Array<INode> = [];
  center: Array<INode> = [];
  right: Array<INode> = [];

  itemMap = new Map<string, INode>();
  totalCost!: ICost;
  remainingCost!: ICost;

  _itemSub?: SubscriptionLike;

  constructor(
    private readonly _eventService: EventService
  ) {
  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['constellation']) {
      this.initializeNodes();
      this.subscribeItemChanged();
      this.calculateRemainingCosts();
    }
  }

  ngOnDestroy(): void {
    this._itemSub?.unsubscribe();
  }

  /** Build grid from nodes. */
  initializeNodes(): void {
    // Reset data
    this.itemMap.clear();
    this.totalCost = { c: 0, h: 0, sc: 0, sh: 0, ac: 0 };
    this.remainingCost = { c: 0, h: 0, sc: 0, sh: 0, ac: 0 };
    this.nodes = []; this.left = []; this.center = []; this.right = [];

    if (!this.constellation) { return; }
    this.initializeNode(this.constellation.node, 0, 0);
  }

  subscribeItemChanged(): void {
    this._itemSub?.unsubscribe();
    this._itemSub = this._eventService.itemToggled
      .pipe(filter(v => this.itemMap.has(v.guid)))
      .subscribe(v => this.onItemChanged(v));
  }

  onItemChanged(item: IItem): void {
    const node = this.itemMap.get(item.guid);
    if (!node) { return; }
    this.calculateRemainingCosts();
  }

  initializeNode(node: INode, direction: number, level: number): void {
    // Save item guid to detect updates
    if (node.item) { this.itemMap.set(node.item.guid, node); }

    this.nodes.push(node);
    const arr = direction < 0 ? this.left : direction > 0 ? this.right : this.center;
    arr[level] = node;

    // Add costs to total
    if (node.c) { this.totalCost.c! += node.c };
    if (node.h) { this.totalCost.h! += node.h };
    if (node.sc) { this.totalCost.sc! += node.sc };
    if (node.sh) { this.totalCost.sh! += node.sh };
    if (node.ac) { this.totalCost.ac! += node.ac };

    if (node.nw) { this.initializeNode(node.nw, -1, level); }
    if (node.ne) { this.initializeNode(node.ne, 1, level); }
    if (node.n) { this.initializeNode(node.n, 0, level + 1); }
  }

  calculateRemainingCosts(): void {
    this.remainingCost = {};
    this.nodes.filter(n => !n.unlocked && !n.item?.unlocked).forEach(n => {
      CostHelper.add(this.remainingCost, n);
    });
  }
}
