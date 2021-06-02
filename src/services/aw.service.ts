import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RequestService } from '../services/request.service';
import { EMPTY, Observable, throwError } from 'rxjs';
import { AwCacheService } from './aw-cache.service';
import { catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AwService {
  constructor(private requestService: RequestService, private cacheService: AwCacheService, private http: HttpClient) {}


  GetActions(account: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      })
    };
    var url = 'https://wax.greymass.com/v1/history/get_actions';
    var payload = {
      "account_name": account,
      "pos": -1,
      "offset": -100
    };
    if (this.cacheService.getCacheItem(url+account)) {
      
      return this.cacheService.getCacheItem(url+account);
    }

    var observable =  this.http.post<any>(
      url,
      payload,
      httpOptions
    ).pipe(
      shareReplay(1),
      catchError(err => {
        this.cacheService.deleteCacheItem(url+account);
        return throwError('error');
      })
    );

    this.cacheService.setCacheItem(url+account, observable);
    return observable;
  }

  GetLogMint(account: string): Observable<any> {
    var url = `history/get_actions?account=${account}&filter=*%3Alogmint&skip=0&limit=100&sort=desc`;

    if (this.cacheService.getCacheItem(url)) {
      
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

    
    
    this.cacheService.setCacheItem(url, observable);
    return observable;
  }
}
