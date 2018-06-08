import { Readable as ReadableStream } from 'stream';
import { Video } from 'simple-youtube-api';
import ytdl = require('ytdl-core');

import Song from '../../core/Song';
import YouTubeService from './Service';
import { SongInfo } from '../../typings/SongMetaData';

export default class YouTubeSong extends Song {
  public readonly type: string = 'youtube';
  public readonly title: string;
  public readonly playlistID?: string;
  public readonly trackID: string;
  public readonly streamURL: string;
  public readonly URL: string;
  public readonly live: boolean;
  public info: SongInfo;
  public seek: number;

  constructor(service: YouTubeService, video: Video, playlistID?: string, seek: number = 0) {
    super(service);
    this.title = video.title;
    this.trackID = video.id;
    this.streamURL = video.url;
    this.URL = video.url;
    this.playlistID = playlistID;
    this.live = video.raw.snippet.liveBroadcastContent == "live";
    this.seek = seek;
    this.info = {
      metadataType: this.type,
      title: this.title,
      url: this.URL,
      duration: video.durationSeconds
    }
  }

  public async getSongInfo(): Promise<SongInfo> {
    this.info = await this.service.getSongInfo(this.URL);
    return this.info;
  }
    
  public static extractSeek(url: string): number {
    var lookFor = ["&t=", "?t="];
    for (var i in lookFor) {
        var key = lookFor[i];
        var start = url.indexOf(key);
        if (start === -1) continue;
        start += key.length;
        var time = "";
        var char = "";
        for (var j = start; j < url.length; j++) {
            char = url[j];
            if (isNaN(Number(char)))
                break;
            time += char;
        }
        return Number(time);
    }
    return 0;
  }

  public stream(): ReadableStream {
    const options: any = {};
    if(this.live) {
        options.quality = ['91', '92', '93', '94', '95'];
    } else {
        options.filter = 'audioonly';
    }
    return ytdl(this.trackID, options);
  }

  public async next(): Promise<null> {
    return null;
  }
}
