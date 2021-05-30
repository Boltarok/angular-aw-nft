import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { AwService } from '../../services/aw.service';
import * as _ from 'lodash';
import moment from 'moment';
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
}

@Component({
  selector: 'aw-nft',
  templateUrl: './aw-nft.component.html',
  styleUrls: ['./aw-nft.component.scss']
})
export class AwNftComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'type','rarity', 'timestamp','action','luck', 'rand1','rand2','rand3'];
  dataSource: MatTableDataSource<NftData>;
  items: NftData[];
  account: string;
  isLoadingResults: boolean = false;
  abundants: number = 0;
  commons: number = 0;
  rares: number = 0;
  epics: number = 0;
  legendaries: number = 0;
  nftsToClaim: number = 0;

  tlms: any[];
  totalTlm: any;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private awService: AwService, private nftService: NftService) {
    this.items = new Array<NftData>();
    this.dataSource = new MatTableDataSource(this.items);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  find() {
    this.isLoadingResults = true;
    var that = this;
    this.awService.GetLogMint(this.account).subscribe((res: any) => {
      this.items = _.map(res.actions, action => {
        var item = new NftData(); 
        item.name = _.find(action.act.data.immutable_template_data, q => q.key == 'name')?.value[1];

        item.rarity = _.find(action.act.data.immutable_template_data, q => q.key == 'rarity')?.value[1];

        item.timestamp = action.timestamp;
        item.timestampLocale = new Date(action.timestamp).toLocaleString();
        item.collection = action.act.data.collection_name;
        item.schema = action.act.data.schema_name;
        if(item.collection == 'alien.worlds') {
          item.type = that.getType(item.schema);
        }
        item.id = action.act.data.asset_id;
        item.img = _.find(action.act.data.immutable_template_data, q => q.key == 'img')?.value[1];
        item.imgLink = `https://resizer.atomichub.io/images/v1/preview?ipfs=${item.img}&size=370`;

        return item;
      });
      this.items = _.filter(this.items, res => {
        return res.collection == 'alien.worlds';
      });
      this.dataSource = new MatTableDataSource(this.items);
      this.dataSource.sort = this.sort;
      this.countNft(this.items);
      this.checkClaimNft(this.account);
      this.isLoadingResults = false;
    });

    var nowDate = moment().utc();
    var nowStr = nowDate.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");
    var nowAfter = nowDate.subtract(1, 'days');
    var nowAfterStr = nowAfter.format("YYYY-MM-DDTHH[%3A]mm[%3A]ss.SSS[Z]");
    this.awService.GetLastTLM(this.account, nowStr,nowAfterStr).subscribe((res: any) => {
      this.tlms = _.map(res.actions, x => x.act.data.amount);
      this.totalTlm = _.sum(this.tlms).toFixed(4);
    });
  }
  checkClaimNft(account: string){
    this.nftService.checkNft(account).subscribe((res:any)=>{
      var result=_.find(res.rows, row => row.miner == this.account);
      if(!!result){
        this.nftsToClaim = result.template_ids.length;
      } else {
        this.nftsToClaim = 0;
      }
    });
  }

  getLogRand(data: NftData) {
    var index = this.items.indexOf(data);
    this.setRandValue(index);
  }
  countNft(items: NftData[]) {
    this.abundants = _.filter(items, x => x.rarity=='Abundant').length;
    this.commons = _.filter(items, x => x.rarity=='Common').length;
    this.rares = _.filter(items, x => x.rarity=='Rare').length;
    this.epics = _.filter(items, x => x.rarity=='Epic').length;
    this.legendaries = _.filter(items, x => x.rarity=='Legendary').length;
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
    if(element.rand1 == 'failed') {
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
