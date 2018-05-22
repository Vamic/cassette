import MusicMetaData = require('musicmetadata');

import { SearchType } from '../../core/Playlist';
import { IFetchable } from '../../interfaces/IFetchable';
import { IService } from '../../interfaces/IService';
import { SongInfo } from '../../typings/SongMetaData';
import DirectSong from './Song';

import { Readable } from 'stream';
import { URL } from "url";
import * as https from "https";

export default class DirectService implements IService {
  public search: boolean = false;
  public regex: RegExp = new RegExp(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/);
  public readonly type: string = 'direct';
  public readonly youtube_dl_path: string;

  constructor(youtube_dl_path: string) {
    if (!youtube_dl_path) throw "No path to youtube-dl provided.";
    this.youtube_dl_path = youtube_dl_path;
  }

  public async fetch(fetchable: IFetchable, searchType?: SearchType): Promise<DirectSong[]> {
    const fetched: DirectSong[] = [];

    for (const songUrl of fetchable.songs) {
      const id: string = songUrl + fetchable.songs.indexOf(songUrl);
      fetched.push(new DirectSong(this, songUrl, id));
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
      if(this.regex.test(elem)) fetchable.songs.push(elem);
    }

    return fetchable;
  }
    
  public async getSongInfo(requestURL: string): Promise<SongInfo> {
    return new Promise<SongInfo>(async (resolve, reject) => {
      const parsedUrl: URL = new URL(requestURL);
      const options: https.RequestOptions = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname
      };
      options.headers = {};
      options.headers.Range = "bytes=0-9";

      const id3_check_request = https.get(options, function (response: Readable) {
          var data = '';
          response.on('data', function (chunk: string) {
              data += chunk;
          }); 
          response.on('end', function () {
              var byte_array = [];
              for (var i = 0; i < data.length; i++) {
                  byte_array.push(data.charCodeAt(i));
              }
              if (byte_array.length !== 10 || !data.startsWith("ID3"))
                reject(new Error("not id3v2: " + data.substr(0, 10)));
                
              var offset = 6;
              var size1 = byte_array[offset];
              var size2 = byte_array[offset + 1];
              var size3 = byte_array[offset + 2];
              var size4 = byte_array[offset + 3];
              
              var size = size4 & 0x7f
                  | (size3 & 0x7f) << 7
                  | (size2 & 0x7f) << 14
                  | (size1 & 0x7f) << 21;
                
              const id3_size = size + 10;

              options.headers = options.headers || {};
              options.headers.Range = "bytes=0-" + id3_size;
              var real_request = https.get(options, function (response: Readable) {
                  MusicMetaData(response, function (err: Error, data: MM.Metadata) {
                    const info: SongInfo = {
                      metadataType: "ID3",
                      title: data.title,
                      duration: 0,
                      url: requestURL,
                  };
                  if (data.picture.length){
                    info.img = data.picture[0].data;
                    info.imgFormat = data.picture[0].format;
                  }
                  if (data.disk.no) info.disk = data.disk;
                  if (data.track.no) info.track = data.track;
                  if (data.year) info.year = Number(data.year);

                  if (data.album.length) info.album = data.album;
                  if (data.artist.length) info.artist = data.artist;
                  if (data.albumartist.length) info.albumartist = data.albumartist;
                  if (data.genre.length) info.genre = data.genre;

                  resolve(info);
                  }).on("error", function (err: Error) {
                    reject(err);
                  });
              });
              real_request.on("error", function (err: Error) {
                reject(err);
              });
          });
        });
        id3_check_request.on("error", function (err: Error) {
          reject(err);
        });
      });
    }
}
