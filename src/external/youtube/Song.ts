import { Readable as ReadableStream } from 'stream';
import API = require('simple-youtube-api');
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
  public info: SongInfo;
  public seek: number;

  constructor(service: YouTubeService, video: API.Video, playlistID?: string, seek: number = 0) {
    super(service);
    this.title = video.title;
    this.trackID = video.id;
    this.streamURL = video.url;
    this.URL = video.url;
    this.playlistID = playlistID;
    this.seek = seek;
    this.info = {
      full: false,
      metadataType: this.type,
      title: this.title,
      url: this.URL,
      duration: video.durationSeconds
    }
  }

  public async getSongInfo(): Promise<SongInfo> {
    if (this.info.full) return this.info;
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
    return ytdl(this.streamURL, {
      filter: 'audioonly',
      quality: 'lowest',
    });
  }

  public async next(): Promise<null> {
    return null;
  }
}
