import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AwService } from '../../services/aw.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { NftService } from '../../services/nft.service';

export class NftData {
  id: string;
  name: string;
  type: string;
  rarity: string;
  collection: string;
  schema: string;
  timestampLocale: string;
  timestamp: string;
  img: string;
  imgLink: string;
  luck: string;
  rand1: string;
  rand2: string;
  rand3: string;
  actionOrdinal: number;
  creatorActionOrdinal: number;
  templateId: string;
}
export class nftTemplate {
  name: string;
  type: string;
  rarity: string;
  collection: string;
  schema: string;
}

export class tlmModel {
  amount: string;
  dateTime: Date;
}

@Component({
  selector: 'aw-nft',
  templateUrl: './aw-nft.component.html',
  styleUrls: ['./aw-nft.component.scss']
})
export class AwNftComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'type', 'rarity', 'timestamp'];
  dataSource: MatTableDataSource<NftData>;
  items: NftData[];
  templates: nftTemplate[];
  account: string;
  isLoadingResults: boolean = false;
  abundants: number = 0;
  commons: number = 0;
  rares: number = 0;
  epics: number = 0;
  legendaries: number = 0;
  nftsToClaim: number = 0;
  accountData: any;

  tlmList: tlmModel[];
  filteredTlm: tlmModel[];
  tlms: any[];

  cpuPercent: string;
  cpuUsed: string;
  cpuFree: string;
  cpuMax: string;

  ramPercent: string;
  ramUsed: string;
  ramMax: string;
  tlmhs: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private awService: AwService, private nftService: NftService) {
    this.items = new Array<NftData>();
    this.templates = new Array<nftTemplate>();
    this.dataSource = new MatTableDataSource(this.items);
    this.tlmhs = '24';
    this.tlmList = new Array<tlmModel>();
    this.filteredTlm = new Array<tlmModel>();

  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  find() {
    this.isLoadingResults = true;
    var that = this;
    this.awService.GetLogMint(this.account).subscribe(
      (res: any) => {
        this.items = _.map(res.actions, action => {
          var item = new NftData();
          item.name = _.find(action.act.data.immutable_template_data, q => q.key == 'name')?.value[1];

          item.rarity = _.find(action.act.data.immutable_template_data, q => q.key == 'rarity')?.value[1];

          item.timestamp = action.timestamp;
          item.timestampLocale = new Date(action.timestamp).toLocaleString();
          item.collection = action.act.data.collection_name;
          item.schema = action.act.data.schema_name;
          if (item.collection == 'alien.worlds') {
            item.type = that.getType(item.schema);
          }
          item.id = action.act.data.asset_id;
          item.img = _.find(action.act.data.immutable_template_data, q => q.key == 'img')?.value[1];
          item.imgLink = `https://resizer.atomichub.io/images/v1/preview?ipfs=${item.img}&size=370`;

          item.actionOrdinal = action.action_ordinal;
          item.creatorActionOrdinal = action.creator_action_ordinal;
          item.templateId = action.act.data.template_id;

          return item;
        });
        this.items = _.filter(this.items, res => {
          return res.collection == 'alien.worlds' && res.actionOrdinal == 3 && res.creatorActionOrdinal == 2;
        });
        this.dataSource = new MatTableDataSource(this.items);
        this.dataSource.sort = this.sort;
        this.countNft(this.items);
        this.checkClaimNft(this.account);
        this.checkAccount(this.account);
        this.isLoadingResults = false;
      }, (error) => {
        console.log('error!!');
        this.isLoadingResults = false;
      }
    );

    var nowDate = moment().utc();
    var nowStr = nowDate.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");
    var nowAfter = nowDate.subtract(1, 'days');
    var nowAfterStr = nowAfter.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");
    this.awService.GetLastTLM(this.account, nowStr, nowAfterStr).subscribe((res: any) => {
      this.tlms = _.map(res.actions, x => x.act.data.amount);
      this.tlmList = _.map(res.actions, x => {
        var tlm = new tlmModel();
        tlm.amount = x.act.data.amount;
        tlm.dateTime = moment(x.timestamp, 'YYYY-MM-DDTHH:mm:ss.SSS').toDate();

        return tlm;
      });
      this.filteredTlm = JSON.parse(JSON.stringify(this.tlmList));
    });
  }
  filterTlm(hs: string) {
    this.filteredTlm = _.filter(this.tlmList, x => {
      var now = moment().utc().subtract(hs, 'hours');
      return moment(x.dateTime).isSameOrAfter(now);
    });
  }
  checkClaimNft(account: string) {
    this.nftService.checkNft(account).subscribe((res: any) => {
      var result = _.find(res.rows, row => row.miner == this.account);
      this.templates = new Array<nftTemplate>();
      if (!!result) {
        this.nftsToClaim = result.template_ids.length;
        result.template_ids.forEach(elem => {
          this.nftService.checkTemplate(elem).subscribe((res2) => {
            var template = new nftTemplate();
            template.name = res2.data.immutable_data.name;
            template.type = this.getType(res2.data.schema.schema_name);
            template.rarity = res2.data.immutable_data.rarity;
            this.templates.push(template);
          });
        });
      } else {
        this.nftsToClaim = 0;
        this.templates = new Array<nftTemplate>();
      }
    });
  }
  checkAccount(account: string) {
    this.nftService.checkAccount(account).subscribe((res: any) => {
      this.accountData = res;

      var max = res.cpu_limit.max / 1000;
      var used = res.cpu_limit.used / 1000;
      var available = res.cpu_limit.available / 1000;

      var ramUsed = res.ram_usage / 1024;
      var ramMax = res.ram_quota / 1024;

      this.ramUsed = ramUsed.toFixed(2);
      this.ramMax = ramMax.toFixed(2);
      this.ramPercent = ((ramUsed * 100) / ramMax).toFixed(2);

      this.cpuFree = available.toFixed(2);
      this.cpuMax = max.toFixed(2);
      this.cpuUsed = used.toFixed(2);
      this.cpuPercent = ((used * 100) / max).toFixed(2);
    });
  }

  getLogRand(data: NftData) {
    var index = this.items.indexOf(data);
    this.setRandValue(index);
  }
  countNft(items: NftData[]) {
    this.abundants = _.filter(items, x => x.rarity == 'Abundant').length;
    this.commons = _.filter(items, x => x.rarity == 'Common').length;
    this.rares = _.filter(items, x => x.rarity == 'Rare').length;
    this.epics = _.filter(items, x => x.rarity == 'Epic').length;
    this.legendaries = _.filter(items, x => x.rarity == 'Legendary').length;
  }

  get totalTlm() {
    return _.sum(_.map(this.filteredTlm, x => x.amount)).toFixed(4);
  }

  getType(schema: string): string {
    switch (schema) {
      case 'faces.worlds':
        return 'Avatar';

      case 'arms.worlds':
        return 'Weapon';

      case 'tool.worlds':
        return 'Tool';

      case 'crew.worlds':
        return 'Minion';

      default:
        return 'Unknown'
    }
  }
  setRandValue(index: number) {
    var element = this.items[index];
    var before = moment(element.timestamp, "YYYY-MM-DDTHH:mm:ss.SSS");
    before = before.subtract(0.5, 'seconds');
    var beforeFinal = before.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");

    var after = moment(element.timestamp, "YYYY-MM-DDTHH:mm:ss.SSS");
    after = after.subtract(1, 'seconds');
    var afterFinal = after.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");

    this.awService.GetLogRand(beforeFinal, afterFinal).subscribe((res: any) => {
      var that = this;
      var result = _.find(res.actions, res => {
        return res.act.data.miner == that.account;
      });
      if (result && result.act && result.act.data) {
        element.luck = result.act.data.params.luck;
        element.rand1 = result.act.data.rand1;
        element.rand2 = result.act.data.rand2;
        element.rand3 = result.act.data.rand3;
      } else {
        element.luck = 'failed';
        element.rand1 = 'failed';
        element.rand2 = 'failed';
        element.rand3 = 'failed';
      }
    });
    if (element.rand1 == 'failed') {
      before = moment(element.timestamp, "YYYY-MM-DDTHH:mm:ss.SSS");
      before = before.subtract(1, 'seconds');
      beforeFinal = before.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");

      after = moment(element.timestamp, "YYYY-MM-DDTHH:mm:ss.SSS");
      after = after.subtract(1.5, 'seconds');
      afterFinal = after.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");

      this.awService.GetLogRand(beforeFinal, afterFinal).subscribe((res: any) => {
        var that = this;
        var result = _.find(res.actions, res => {
          return res.act.data.miner == that.account;
        });
        if (result && result.act && result.act.data) {
          element.luck = result.act.data.params.luck;
          element.rand1 = result.act.data.rand1;
          element.rand2 = result.act.data.rand2;
          element.rand3 = result.act.data.rand3;
        } else {
          element.luck = 'failed';
          element.rand1 = 'failed';
          element.rand2 = 'failed';
          element.rand3 = 'failed';
        }
        // this.isLoadingResults = false;
      });
    }

  }
}
