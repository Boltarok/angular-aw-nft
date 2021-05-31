import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NftService {
  baseUrl: string = 'https://wax.greymass.com/v1/';

  constructor(private http: HttpClient) {}

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
    return this.http.post<any>(
      `${this.baseUrl}chain/get_table_rows`,
      payload,
      httpOptions
    );
  }

  checkTemplate(templateId: string) : Observable<any> {
    const url = `https://wax.api.atomicassets.io/atomicassets/v1/templates/alien.worlds/${templateId}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      })
    };

    return this.http.get<any>(url, httpOptions);
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
    return this.http.post<any>(
      `${this.baseUrl}chain/get_account`,
      payload,
      httpOptions
    );
  }
}
