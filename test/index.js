require('dotenv').config({ path: './test/.env' });
const test = require('ava');
const discord = require('discord.js');

const playlists = require('../dist/index');

let client;
let playlist;
let services;

test.serial('create services', t => {
  services = {
    youtube: new playlists.YouTubeService(process.env.YOUTUBE_API_KEY),
    soundcloud: new playlists.SoundcloudService(process.env.SOUNDCLOUD_API_KEY),
    direct: new playlists.DirectService(process.env.YOUTUBE_DL_PATH)
  };
  return t.pass();
});

test.serial('create playlist', t => {
  playlist = new playlists.Playlist(client);
  return t.pass();
});

test.serial('[youtube] add video URLs to playlist', async t => {
  let service = [services.youtube];
  const prevAmount = playlist.length;
  await playlist.add('https://www.youtube.com/watch?v=OVMuwa-HRCQ https://www.youtube.com/watch?v=MwSkC85TDgY https://www.youtube.com/playlist?list=PLF5C76212C58C464A', service);
  return t.true((playlist.length-prevAmount) > 100);
});

test.serial('[youtube] add livestream to playlist', t => {
  let service = [services.youtube];
  return playlist.add('https://www.youtube.com/watch?v=ueupsBPNkSc', service).then(() => t.pass());
});

test.serial('[youtube] add search to playlist', t => {
  let service = [services.youtube];
  return playlist.add('globgogabgalab', service).then((songs) => t.true(songs.length > 0));
});

test.serial('[youtube] get seek to time', t => {
  let service = [services.youtube];
  return playlist.add('https://youtu.be/OVMuwa-HRCQ?t=25', service).then((songs) => t.true(songs[0].seek === 25));
});

test.serial('[youtube] passes regex', t => {
  t.true(services.youtube.regex.test('https://youtu.be/OVMuwa-HRCQ?t=25'));
  t.true(services.youtube.regex.test('https://www.youtube.com/playlist?list=PLF5C76212C58C464A'));
});


test.serial('[soundcloud] add song URLs to playlist', async t => {
  let service = [services.soundcloud];
  const prevAmount = playlist.length;
  await playlist.add('https://soundcloud.com/user537958032/woke-from-dreaming https://soundcloud.com/tom-stetson-905539972/sets/the-chill-pill', service);
  t.true((playlist.length-prevAmount) > 100);
});

test.serial('[soundcloud] add likes page playlist', async t => {
  let service = [services.soundcloud];
  const prevAmount = playlist.length;
  await playlist.add('https://soundcloud.com/user377137195/likes', service);
  return t.true((playlist.length-prevAmount) > 100);
});

test.serial('[soundcloud] get seek to time', t => {
  let service = [services.soundcloud];
  return playlist.add('https://soundcloud.com/user537958032/woke-from-dreaming#t=1:41', service).then((songs) => t.true(songs[0].seek === 101));
});

test.serial('[soundcloud] passes regex', t => {
  return t.true(services.soundcloud.regex.test('https://soundcloud.com/user377137195/likes')
             && services.soundcloud.regex.test('https://soundcloud.com/user537958032/woke-from-dreaming')
             && services.soundcloud.regex.test('https://soundcloud.com/tom-stetson-905539972/sets/the-chill-pill'));
});

test.serial('[direct] add music URLs to playlist', async t => {
  let service = [services.direct];
  const prevAmount = playlist.length;
  await playlist.add('https://upload.wikimedia.org/wikipedia/commons/a/a2/Du_gamla%2C_du_fria.ogg', service);
  return t.true((playlist.length-prevAmount) > 0);
});

test.serial('[direct] add radio stream', async t => {
  let service = [services.direct];
  await playlist.add('https://listen.moe/stream', service);
  return t.pass();
});

test.serial('[direct] get seek to time', t => {
  let service = [services.direct];
  return playlist.add('https://upload.wikimedia.org/wikipedia/commons/a/a2/Du_gamla%2C_du_fria.ogg#t=25', service).then((songs) => t.true(songs[0].seek === 25));
});

test.serial('[direct] passes regex', t => {
  return t.true(services.direct.regex.test('https://upload.wikimedia.org/wikipedia/commons/a/a2/Du_gamla%2C_du_fria.ogg#t=25'));
});

test.serial('shuffles', t => {
  if (playlist.length < 2) return t.pass();

  const before = playlist.slice();
  playlist.shuffle();
  return t.not(before, playlist);
});

test.serial('advances', t => {
  const before = playlist.pos;
  const song = playlist.current;

  return playlist.next().then(r => {
    t.true(r);
    t.deepEqual(playlist[before], song);
    return t.is(before + 1, playlist.pos);
  });
});

test.serial('reverses', t => {
  const before = playlist.pos;
  const song = playlist.current;

  t.true(playlist.prev());
  t.deepEqual(playlist[playlist.pos + 1], song);
  return t.is(before - 1, playlist.pos);
});

test.serial('resets', t => {
  playlist.reset();
  t.is(0, playlist.length);
  return t.is(0, playlist.pos);
});
