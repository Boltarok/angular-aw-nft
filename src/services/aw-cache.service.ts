import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimestampObservableCache } from 'src/util/timestamp-observable-cache.model';

@Injectable({
    providedIn: 'root'
})
export class AwCacheService {
    awCache: { [id: string]: TimestampObservableCache<any> };

    constructor() { 
        this.awCache = {}
    }

    getCacheItem(key: string): Observable<any> {
        let cacheItem = this.awCache[key];

        if (!cacheItem) {
            return null;
        }

        // delete the cache item if it has expired
        if (cacheItem.expires <= Date.now()) {
            this.deleteCacheItem(key);
            return null;
        }

        return cacheItem?.observable;
    }

    setCacheItem(key: string, value: Observable<any>): void {
        const EXPIRES = Date.now() + (1000 * 60 * 60) / 30;
        this.awCache[key] = { expires: EXPIRES, observable: value } as TimestampObservableCache<any>;
    }

    deleteCacheItem(key: string) {
        delete this.awCache[key];
    }
}
