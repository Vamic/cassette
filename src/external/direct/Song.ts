import { Readable as ReadableStream } from 'stream';

import Song from '../../core/Song';
import DirectService from './Service';

import { spawn } from "child_process";
import { SongInfo } from '../../typings/SongMetaData';

export default class DirectSong extends Song {
  public readonly type: string = 'direct';
  public readonly title: string;
  public readonly playlistID?: string;
  public readonly trackID: string;
  public readonly streamURL: string;
  public readonly URL: string;
  public readonly youtube_dl_path: string;
  public info: SongInfo;
  public seek: number;

  constructor(service: DirectService, url: string, id: string) {
    super(service);
    this.title = url.split("/").slice(-1)[0];
    this.trackID = id;
    this.streamURL = url;
    this.URL = url;
    this.seek = this.extractSeek(url);
    this.youtube_dl_path = service.youtube_dl_path;
    this.info = {
      metadataType: this.type,
      url: this.URL,
      duration: 0
    }
  }
  
  public async getSongInfo(): Promise<SongInfo> {
    this.info = await this.service.getSongInfo(this.URL);
    return this.info;
  }
  
  public extractSeek(url: string): number {
    const lookFor: string[] = ["&t=", "#t=", "?t=", "#"];
    for (const key of lookFor) {
      var start = url.indexOf(key);
      if (start === -1) continue;
      start += key.length;
      var time: string = "";
      var char: string = "";
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
    const ytdl = spawn(this.youtube_dl_path, ["--no-playlist", "-f", "bestaudio/best/worst", "-o", "-", this.streamURL]);
    return ytdl.stdout;
  }

  public async next(): Promise<null> {
    return null;
  }
}
