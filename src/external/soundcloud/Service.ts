import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import url = require('url');

import { SearchType } from '../../core/Playlist';
import SoundcloudSong from './Song';
import { SongInfo } from '../../typings/SongMetaData';

import { IFetchable } from '../../interfaces/IFetchable';
import { IService } from '../../interfaces/IService';

import { Playlist, Track } from '../../typings/Soundcloud';
import { isUndefined } from 'util';

export default class SoundcloudService implements IService {
  public static isViewURL(test: string) {
    const parsed = url.parse(test);
    if (!parsed.pathname || !parsed.hostname) return false;
    const parts = parsed.pathname.split('/');
    return (parsed.hostname === 'soundcloud.com' || parsed.hostname === 'www.soundcloud.com') && parts.length >= 2;
  }
  
  private async getFullResourceUrl(inputUrl: string): Promise<url.Url> {
    try {
      await this.request.get('/resolve', {
        params: { url: inputUrl },
        maxRedirects: 0
      })
      return url.parse(inputUrl);
    } catch (err) {
      if(err.response.status !== 302) {
        return url.parse(inputUrl);
      }
      const redirect_url = err.response.data.location;
      return url.parse(redirect_url);
    }
  }

  public readonly request: AxiosInstance;
  public search: boolean = false;
  public regex: RegExp = /https?:\/\/(www\.)*soundcloud.com\/.*?\/./i;
  public type: string = 'soundcloud';

  constructor(key: string) {
    this.request = axios.create({
      baseURL: 'https://api.soundcloud.com',      
      params: {
        client_id: key,
      },
    });
  }

  public formatSongs(songs: Track[], playlistID?: number, seek?: number): SoundcloudSong[] {
    return songs.filter((t) => t.streamable).map((t) => new SoundcloudSong(this, t, playlistID, seek));
  }

  public async fetch(fetchable: IFetchable, searchType?: SearchType): Promise<SoundcloudSong[]> {
    const songs: SoundcloudSong[] = [];

    for (const resource of fetchable.playlists.concat(fetchable.songs)) {
      var fullresource: url.Url = await this.getFullResourceUrl(resource);
      if (!fullresource.pathname || !fullresource.hostname) throw new Error("Invalid url resource");
      
      const axiosConfig: AxiosRequestConfig = {
        params: {
          url: resource
        }
      }
      if(fullresource.pathname.indexOf("playlist") === -1) {
        axiosConfig.params.limit = 50;
        axiosConfig.params.linked_partitioning = 1;
      }

      let result = await this.request.get(fullresource.pathname, axiosConfig);

      while (result.data.next_href) {
        const parsed = url.parse(result.data.next_href, true);
        if (!parsed.pathname || !parsed.hostname) throw new Error("Invalid url in next_href");
        axiosConfig.params.cursor = parsed.query.cursor
        const next_page = await this.request.get(parsed.pathname, axiosConfig);
        result.data.collection = result.data.collection.concat(next_page.data.collection);
        result.data.next_href = next_page.data.next_href;
      }
      
      switch (result.data.kind) {
        case 'playlist':
          songs.push(...this.formatSongs(result.data.tracks, result.data.id));
          break;
        case 'track':
          let seek = SoundcloudSong.extractSeek(resource);
          songs.push(...this.formatSongs([result.data], undefined, seek));
          break;
        default:
          if(Array.isArray(result.data))
            songs.push(...this.formatSongs(result.data));
          else if(Array.isArray(result.data.collection))
            songs.push(...this.formatSongs(result.data.collection));
          break;
      }
      
    }

    if (this.search) {
      for (const query of fetchable.queries) {
        if (searchType === 'playlist') {
          const result = await this.request.get('/playlists', {
            params: { q: query },
          });

          songs.push(...this.formatSongs(result.data[0].tracks, result.data[0].id));
        } else {
          const result = await this.request.get('/tracks', {
            params: { q: query },
          });

          songs.push(...this.formatSongs([result.data[0]]));
        }
      }
    }

    return songs;
  }

  public fetchable(content: string): IFetchable {
    const words = content.split(' ');
    const fetchable: IFetchable = {
      playlists: [],
      queries: [],
      songs: [],
    };

    const search = [];
    for (const word of words) {
      if (SoundcloudService.isViewURL(word)) fetchable.songs.push(word);
      else search.push(word);
    }

    fetchable.queries.push(search.join(' '));
    return fetchable;
  }

  public async getSongInfo (url: string): Promise<SongInfo> {
    var fullresource: url.Url = await this.getFullResourceUrl(url);
    if (!fullresource.pathname || !fullresource.hostname) throw new Error("Invalid url resource");
    
    let result = await this.request.get(fullresource.pathname);
    return {
      full: true,
      metadataType: this.type,
      imgURL: result.data.artwork_url,
      title: result.data.title,
      duration: Math.floor(result.data.duration / 1000),
      url: result.data.permalink_url,
      genre: [result.data.genre]
    };
  };
}
