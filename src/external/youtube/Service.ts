import API = require('simple-youtube-api');
import ytdl = require('ytdl-core');

import { SearchType } from '../../core/Playlist';
import { IFetchable } from '../../interfaces/IFetchable';
import { IService } from '../../interfaces/IService';
import YouTubeSong from './Song';

export default class YouTubeService implements IService {
  public readonly api: API;
  public search: boolean = true;
  public regex: RegExp = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/i;
  public type: string = 'youtube';

  constructor(key: string) {
    this.api = new API(key);
  }

  public async fetch(fetchable: IFetchable, searchType?: SearchType): Promise<YouTubeSong[]> {
    const fetched: YouTubeSong[] = [];

    for (const playlist of fetchable.playlists) {
      const p = await this.api.getPlaylistByID(playlist);
      if (!p) continue;
      await p.getVideos();
      fetched.push(...p.videos.map((v) => new YouTubeSong(this, v, playlist)));
    }

    for (const song of fetchable.songs) {
      const parsed = API.util.parseURL(song);
      const video = await this.api.getVideoByID(parsed.video);
      const seek = YouTubeSong.extractSeek(song);
      if (video) fetched.push(new YouTubeSong(this, video, undefined, seek));
    }

    if (this.search) {
      for (const query of fetchable.queries) {
        if (searchType === 'playlist') {
          const results = await this.api.searchPlaylists(query, 1);
          if (results.length) {
            const list = results[0];
            const videos = await list.getVideos();
            fetched.push(...videos.map((v) => new YouTubeSong(this, v, list.id)));
          }
        } else {
          const results = await this.api.searchVideos(query, 1);
          if (results.length) fetched.push(new YouTubeSong(this, results[0]));
        }
      }
    }

    return fetched;
  }

  public fetchable(content: string): IFetchable {
    const words = content.split(' ');
    const query = [];
    const fetchable: IFetchable = {
      playlists: [],
      queries: [],
      songs: [],
    };

    for (const elem of words) {
      const parsed = API.util.parseURL(elem);
      
      if (parsed.video) {
        fetchable.songs.push(elem);
      } else if (parsed.playlist) {
        fetchable.playlists.push(parsed.playlist);
      } else if (!parsed.channel) {
        query.push(elem);
      }
    }

    const joined = query.join(' ');
    if (joined.length) fetchable.queries.push(joined);

    return fetchable;
  }

  public async getSongInfo (url: string): Promise<any> {
    ytdl.getInfo(url, { filter: "audioonly" }, function (err, info) {
        if (err) throw err;
        else {
            return {
                metadataType: "youtube",
                imgURL: info.thumbnail_url,
                title: info.title,
                duration: info.length_seconds,
                url: info.video_url,
                icon: "https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-256.png"
            }
        }
    });
  }
}
