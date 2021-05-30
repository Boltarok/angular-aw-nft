import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestService } from '../services/request.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AwService {
  constructor(private requestService: RequestService) {}

  GetLogMint(account: string): Observable<any> {
    return this.requestService.get(
      `history/get_actions?account=${account}&filter=*%3Alogmint&skip=0&limit=100&sort=desc`
    );
  }

  GetLogRand(before: string, after: string): Observable<any> {
    return this.requestService.get(
      `history/get_actions?account=m.federation&filter=*%3Alogrand&skip=0&limit=100&sort=desc&after=${after}&before=${before}`
    );
  }
  GetLastTLM(account: string, before: string, after: string): Observable<any> {
    return this.requestService.get(
      `history/get_actions?account=${account}&filter=alien.worlds%3A*&skip=0&limit=100&sort=desc&transfer.to=${account}&after=${after}&before=${before}`
    );
  }
}
