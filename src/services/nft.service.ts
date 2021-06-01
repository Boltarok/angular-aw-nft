import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { AwCacheService } from './aw-cache.service';
import { catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NftService {
  baseUrl: string = 'https://wax.greymass.com/v1/';

  constructor(private http: HttpClient, private cacheService: AwCacheService) {}

  checkNft(account: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      })
    };
    const payload = {
      json: true,
      code: 'm.federation',
      scope: 'm.federation',
      table: 'claims',
      table_key: '',
      lower_bound: account,
      upper_bound: null,
      index_position: 1,
      key_type: '',
      limit: '100',
      reverse: false,
      show_payer: false
    };
    var url = `${this.baseUrl}chain/get_table_rows`;

    if (this.cacheService.getCacheItem(url+account)) {
      console.log('Retrieved item from cache');
      return this.cacheService.getCacheItem(url+account);
    }

    var observable = this.http.post<any>(
      url,
      payload,
      httpOptions
    ).pipe(
      shareReplay(1),
      catchError(err => {
        this.cacheService.deleteCacheItem(url+account);
        return EMPTY;
      })
    );

    console.log('Retrieved item from API');
    
    this.cacheService.setCacheItem(url+account, observable);
    return observable;
  }

  checkTemplate(templateId: string) : Observable<any> {
    const url = `https://wax.api.atomicassets.io/atomicassets/v1/templates/alien.worlds/${templateId}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      })
    };

    if (this.cacheService.getCacheItem(url)) {
      console.log('Retrieved item from cache');
      return this.cacheService.getCacheItem(url);
    }

    var observable =  this.http.get<any>(url, httpOptions).pipe(
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

  checkAccount(account: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      })
    };
    const payload = {
      account_name: account
    };
    var url = `${this.baseUrl}chain/get_account`;

    if (this.cacheService.getCacheItem(url+account)) {
      console.log('Retrieved item from cache');
      return this.cacheService.getCacheItem(url+account);
    }

    var observable = this.http.post<any>(
      url,
      payload,
      httpOptions
    ).pipe(
      shareReplay(1),
      catchError(err => {
        this.cacheService.deleteCacheItem(url+account);
        return EMPTY;
      })
    );

    console.log('Retrieved item from API');
    
    this.cacheService.setCacheItem(url+account, observable);
    return observable;
  }
}
