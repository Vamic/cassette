import { Readable as ReadableStream } from 'stream';
import { IService } from '../interfaces/IService';
import { SongInfo } from '../typings/SongMetaData';

export default abstract class Song {
  public readonly service: IService;

  public loop: boolean = false;
  public abstract readonly type: string;
  public abstract readonly title: string;
  public abstract readonly trackID: string | number;
  public abstract readonly playlistID?: string | number;
  public abstract readonly streamURL: string;
  public abstract readonly URL: string;
  public abstract info?: SongInfo;

  constructor(service: IService) {
    this.service = service;
    Object.defineProperty(this, 'service', { value: service });
  }

  public toggleLoop(): boolean {
    return this.loop = !this.loop;
  }

  public abstract next(): Promise<Song | null>;
  public abstract stream(): Promise<ReadableStream> | ReadableStream;
}
