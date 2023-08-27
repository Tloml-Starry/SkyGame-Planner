import { Component } from '@angular/core';
import dayjs from 'dayjs';
import { DateHelper } from 'src/app/helpers/date-helper';
import { IEvent, IEventInstance } from 'src/app/interfaces/event.interface';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.less']
})
export class EventsComponent {
  recurring!: Array<IEvent>;
  old!: Array<IEvent>;
  lastInstances: { [eventGuid: string]: IEventInstance | undefined } = {};
  activeEvents: { [eventGuid: string]: IEvent } = {};
  eventMap: { [eventGuid: string]: IEvent } = {};
  hasActiveEvents = false;

  constructor(
    private readonly _dataService: DataService
  ) {}

  ngOnInit(): void {
    this.recurring = [];
    this.old = [];

    this._dataService.eventConfig.items.forEach(event => {
      this.eventMap[event.guid] = event;

      if (event.recurring) {
        this.recurring.push(event);
      } else {
        this.old.push(event);
      }

      if (event.instances) {
        const instances = [...event.instances];
        const reverseInstances = [...instances].reverse();

        // Mark active if one of the last two instances is active (check 2 in case last item is in future).
        const isActive = instances.slice(-2).find(i => DateHelper.isActive(i.date, i.endDate)) ? true : false;
        if (isActive) {
          this.activeEvents[event.guid] = event;
          this.hasActiveEvents = true;
        }

        // Find last instance based on event.date.
        const now = dayjs();
        const lastInstance = instances.find(i => DateHelper.isActive(i.date, i.endDate)) ?? reverseInstances.find(i => i.date.isBefore(now));
        this.lastInstances[event.guid] = lastInstance;
      }
    });

    // Sort past events by last instance date.
    this.old.sort((a, b) => {
      if (!this.lastInstances[a.guid]) { return 1; }
      if (!this.lastInstances[b.guid]) { return -1; }
      return this.lastInstances[b.guid]!.date.diff(this.lastInstances[a.guid]!.date);
    });
  }
}
