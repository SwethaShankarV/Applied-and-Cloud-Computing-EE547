const axios = require('axios');
const { ApiError, EntityNotFoundError } = require('./error'); // import error classes

class SpotifyApi {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  // Get access token using client credentials
  static async getAccessToken(clientId, clientSecret) {
    const bearer = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${bearer}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data.access_token;
    }
    catch (error) {
      throw new ApiError('Error fetching access token');
    }
  }

  getAlbum(albumId, callback) {
    axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })
    .then((response) => {
      const album = {
        albumId: response.data.id,
        artists: response.data.artists.map(artist => ({
          artistId: artist.id,
          followers: artist.followers?.total || 0,
          genres: artist.genres || [],
          imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : '',
          name: artist.name,
          popularity: artist.popularity || 0,
        })),
        genres: response.data.genres || [],
        name: response.data.name,
        imageUrl: response.data.images && response.data.images.length > 0 ? response.data.images[0].url : '',
        releaseDate: response.data.release_date,
        tracks: response.data.tracks.items.map(track => ({
          albumId: response.data.id,
          artists: track.artists.map(artist => ({
            artistId: artist.id,
            name: artist.name,
          })),
          durationMs: track.duration_ms,
          trackId: track.id,
          name: track.name,
          popularity: track.popularity || 0,
          previewUrl: track.preview_url || '',
        })),
      };
      callback(null, album);
    })
    .catch((error) => {
      if (error.response && error.response.status === 404) {
        callback(new EntityNotFoundError(`Album not found: ${albumId}`));
      }
      else {
        callback(new ApiError(`API Error: ${error.message}`));
      }
    });
  }

  searchAlbums(query, callback) {
    axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      params: { q: query, type: 'album' },
    })
    .then(response => {
      const albums = response.data.albums.items;
      callback(null, albums);
    })
    .catch((error) => callback(new ApiError('Error searching albums')));
  }

  getTrack(trackId, callback) {
    axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    .then((response) => {
      console.log("Spotify API Track Response:", JSON.stringify(response.data, null, 2));
      
      if (!response.data || !response.data.name) {
        console.error('Track data is missing or incomplete:', response.data);
        return callback(new ApiError('Track data is incomplete'));
      }
      
      const track = {
        albumId: response.data.album ? response.data.album.id : null,
        artists: response.data.artists ? response.data.artists.map(artist => ({
          artistId: artist.id,
          name: artist.name,
        })) : [],
        durationMs: response.data.duration_ms || 0,
        trackId: response.data.id,
        name: response.data.name || 'Unknown Track',
        popularity: response.data.popularity || 0,
        previewUrl: response.data.preview_url || '',
      };      
    
      callback(null, track);
    })
    .catch((error) => {
      console.error('Error fetching track:', error.response?.data || error.message);
      callback(new ApiError('Error fetching track'));
    });        
  }

  searchTracks(query, callback) {
    axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: {
          q: query,
          type: 'track',
        },
      })
      .then(response => {
        const tracks = response.data.tracks.items;
        callback(null, tracks);
      })
      .catch((error) => {
        callback(new ApiError('Error searching tracks'));
      });
  }

  getArtist(artistId, callback) {
    console.log("Fetching artist with ID:", artistId); 
    axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    .then((response) => {
      console.log("Spotify API Artist Response:", JSON.stringify(response.data, null, 2));
      const artist = {
        artistId: response.data.id,
        followers: response.data.followers.total,
        genres: response.data.genres,
        imageUrl: response.data.images[0]?.url,
        name: response.data.name,
        popularity: response.data.popularity,
      };
      callback(null, artist);
    })
    .catch((error) => {
      if (error.response) {
        console.error('Error response from API:', error.response.data); 
      } else {
        console.error('Error message:', error.message);
      }
      callback(new ApiError('Error fetching artist'));
    });
  }    

  searchArtists(query, callback) {
    axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      params: { q: query, type: 'artist' },
    })
    .then(response => {
      const artists = response.data.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        imageUrl: artist.images?.[0]?.url || '', 
        popularity: artist.popularity,
      }));
  
      console.log("Artists with Image URL:", artists); 
      callback(null, artists);
    })
    .catch((error) => {
      console.error("Error searching artists:", error.response?.data || error.message);
      callback(new ApiError('Error searching artists'));
    });
  }      

  getArtistTopTracks(artistId, marketCode, callback) {
    axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: { market: marketCode },
      })
      .then((response) => {
        const tracks = response.data.tracks.map((item) => ({
          albumId: item.album.id,
          trackId: item.id,
          name: item.name,
          artists: item.artists.map(artist => ({
            artistId: artist.id,
            name: artist.name,
          })),
          durationMs: item.duration_ms,
          popularity: item.popularity, 
        }));
        callback(null, tracks);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          callback(new EntityNotFoundError('Artist top tracks not found'));
        }
        else {
          callback(new ApiError('Error fetching artist top tracks'));
        }
      });
  }

  getPlaylist(playlistId, callback) {
    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    .then((response) => {
      const playlist = {
        description: response.data.description,
        followers: response.data.followers.total,
        playlistId: response.data.id,
        imageUrl: response.data.images[0]?.url || '',
        name: response.data.name,
        owner: { userId: response.data.owner.id },
        public: response.data.public,
        tracks: response.data.tracks.items.map(item => ({
          albumId: item.track.album.id,
          artists: item.track.artists.map(artist => ({ artistId: artist.id, name: artist.name })),
          durationMs: item.track.duration_ms,
          trackId: item.track.id,
          name: item.track.name,
          popularity: item.track.popularity,
          previewUrl: item.track.preview_url || '',
        })),
      };
      callback(null, playlist);
    })
    .catch((error) => {
      if (error.response?.status === 404) {
        callback(new EntityNotFoundError('Playlist not found'));
      }
      else {
        callback(new ApiError('Error fetching playlist'));
      }
    });
  }
}

module.exports = { SpotifyApi };
