import { Readable as ReadableStream } from 'stream';
import Song from '../../core/Song';
import { Track } from '../../typings/Soundcloud';
import SoundcloudService from './Service';
import { SongInfo } from '../../typings/SongMetaData';

export default class SoundcloudSong extends Song {
  public readonly type = 'soundcloud';
  public readonly title: string;
  public readonly playlistID?: number;
  public readonly trackID: number;
  public readonly streamURL: string;
  public readonly URL: string;
  public info: SongInfo;
  public seek: number;

  constructor(service: SoundcloudService, track: Track, playlistID?: number, seek: number = 0) {
    super(service);

    this.title = track.title;
    this.trackID = track.id;
    this.streamURL = track.stream_url;
    this.URL = track.permalink_url;
    this.playlistID = playlistID;
    this.seek = seek;
    this.info = {
      full: true,
      metadataType: this.type,
      url: this.URL,
      title: this.title,
      duration: Math.floor(track.duration / 1000),
      genre: [track.genre],
      imgURL: track.artwork_url
    }
  }
  
  public async getSongInfo(): Promise<SongInfo> {
    if (this.info.full) return this.info;
    this.info = await this.service.getSongInfo(this.URL);
    return this.info;
  }
  
  public static extractSeek(input:string): number {
    if (input.indexOf("#t=") > -1) {
      input = input.split("#t=")[1];
      if (input.indexOf(":") > -1) {
        const parts = input.split(":");
        return Number(parts[0]) * 60 + Number(parts[1]);
      }
    }
    return 0;
  }

  public async stream(): Promise<ReadableStream> {
    const svc = this.service as SoundcloudService;
    const result = await svc.request.get(this.streamURL, {
      responseType: 'stream',
    });

    return result.data;
  }

  public async next(): Promise<null> {
    return null;
  }
}
