import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestService } from '../services/request.service';
import { EMPTY, Observable, throwError } from 'rxjs';
import { AwCacheService } from './aw-cache.service';
import { catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AwService {
  constructor(private requestService: RequestService, private cacheService: AwCacheService) {}

  GetLogMint(account: string): Observable<any> {
    var url = `history/get_actions?account=${account}&filter=*%3Alogmint&skip=0&limit=100&sort=desc`;

    if (this.cacheService.getCacheItem(url)) {
      console.log('Retrieved item from cache');
      return this.cacheService.getCacheItem(url);
    }

    var observable = this.requestService.get(
      url
    ).pipe(
      shareReplay(1),
      catchError(err => {
        this.cacheService.deleteCacheItem(url);
        return throwError('error');
      })
    );
    console.log('Retrieved item from API');
    
    this.cacheService.setCacheItem(url, observable);
    return observable;
  }

  GetLogRand(before: string, after: string): Observable<any> {
    return this.requestService.get(
      `history/get_actions?account=m.federation&filter=*%3Alogrand&skip=0&limit=100&sort=desc&after=${after}&before=${before}`
    );
  }
  GetLastTLM(account: string, before: string, after: string): Observable<any> {
    var url = `history/get_actions?account=${account}&filter=alien.worlds%3A*&skip=0&limit=100&sort=desc&transfer.to=${account}`;

    if (this.cacheService.getCacheItem(url)) {
      console.log('Retrieved item from cache');
      return this.cacheService.getCacheItem(url);
    }

    var observable =  this.requestService.get(
      `${url}&after=${after}&before=${before}`
    ).pipe(
      shareReplay(1),
      catchError(err => {
        this.cacheService.deleteCacheItem(url);
        return EMPTY;
      })
    );

    console.log('Retrieved item from API');
    
    this.cacheService.setCacheItem(url, observable);
    return observable;
  }
}
