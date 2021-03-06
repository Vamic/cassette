export type Track = {
  id: number;
  created_at: string;
  user_id: number;
  user: any;
  title: string;
  permalink: string;
  permalink_url: string;
  uri: string;
  sharing: string;
  embeddable_by: 'all' | 'me' | 'none';
  purchase_url: string;
  artwork_url: string;
  description: string;
  label: any;
  duration: number;
  genre: string;
  tag_list: string;
  label_id: number;
  label_name: string;
  release: number;
  release_day: number;
  release_month: number;
  release_year: number;
  streamable: boolean;
  downloadable: boolean;
  state: 'processing' | 'failed' | 'finished';
  license:
    'no-rights-reserved' |
    'all-rights-reserved' |
    'cc-by' |
    'cc-by-nc' |
    'cc-by-nd' |
    'cc-by-sa' |
    'cc-by-nc-nd' |
    'cc-by-nc-sa';
  track_type:
    'original' |
    'remix' |
    'live' |
    'recording' |
    'spoken' |
    'podcast' |
    'demo' |
    'in progress' |
    'stem' |
    'loop' |
    'sound effect' |
    'sample' |
    'other';
  waveform_url: string;
  download_url: string;
  stream_url: string;
  video_url: string;
  bpm: number;
  commentable: boolean;
  isrc: string;
  key_signature: string;
  comment_count: number;
  download_count: number;
  playback_count: number;
  favoritings_count: number;
  original_format: string;
  original_content_size: number;
};

export type Playlist = {
  id: number;
  created_at: string;
  user_id: number;
  user: any;
  title: string;
  permalink: string;
  permalink_url: string;
  uri: string;
  sharing: string;
  embeddable_by: 'all' | 'me' | 'none';
  purchase_url: string;
  artwork_url: string;
  description: string;
  label: any;
  duration: number;
  genre: string;
  tag_list: string;
  label_id: number;
  label_name: string;
  release: number;
  release_day: number;
  release_month: number;
  release_year: number;
  streamable: boolean;
  downloadable: boolean;
  ean: string;
  playlist_type:
    'ep single' |
    'album' |
    'compilation' |
    'project files' |
    'archive' |
    'showcase' |
    'demo' |
    'sample pack' |
    'other';
  tracks: Track[];
};
