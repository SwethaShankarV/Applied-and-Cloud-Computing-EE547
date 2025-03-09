const { SpotifyApi } = require('./spotifyApi');

(async () => {
    const clientId = 'd939444413bf4282824e4b895094d6a9';
    const clientSecret = '343002a45e164868bc16828469b49593';

    try {
        const accessToken = await SpotifyApi.getAccessToken(clientId, clientSecret);
        console.log('Access Token:', accessToken);

        const spotifyApi = new SpotifyApi(accessToken);

        spotifyApi.getAlbum('2gNPnKP1PDkB5SZz3IMKuX', (err, album) => {
            if (err) {
                console.error('Error:', err);
            } 
            else {
                console.log('Album:', JSON.stringify(album, null, 2));  //stringify to see truncated objects in terminal
            }
        });
        
        spotifyApi.searchAlbums('rock', (err, albums) => {
            if (err) {
              console.error('Error:', err);
            } else {
              console.log('Albums:', JSON.stringify(albums, null, 2));
            }
        });

        spotifyApi.getTrack('4JUPEh2DVSXFGExu4Uxevz', (err, track) => {
            if (err) {
            console.error('Error:', err);
            } else {
            console.log('Track:', track);
            }
        });

        spotifyApi.searchTracks('Hold on', (err, tracks) => {
            if (err) {
            console.error('Error:', err);
            } else {
            console.log('Tracks:', tracks);
            }
        });

        spotifyApi.getArtist('4dpARuHxo51G3z768sgnrY', (err, artist) => {
            if (err) {
            console.error('Error:', err);
            } else {
            console.log('Artist:', artist);
            }
        });

        spotifyApi.getArtistTopTracks('4dpARuHxo51G3z768sgnrY', 'US', (err, tracks) => {
            if (err) {
            console.error('Error:', err);
            } else {
            console.log('Top Tracks:', tracks);
            }
        });
        
        spotifyApi.getPlaylist('4mPbs4Odi727wBGn4xc9hz', (err, playlist) => {
            if (err) {
            console.error('Error:', err);
            } else {
            console.log('Playlist:', playlist);
            }
        });
    }
    catch (error) {
        console.error('Error during setup:', error);
    }
})();

