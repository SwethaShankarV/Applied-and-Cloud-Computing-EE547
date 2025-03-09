const express = require('express');
const router = express.Router();
const { SpotifyApi } = require('../spotifyApi');
const path = require('path');

// Get the access token
let accessToken = '';
const clientId = 'd939444413bf4282824e4b895094d6a9';
const clientSecret = '343002a45e164868bc16828469b49593';

SpotifyApi.getAccessToken(clientId, clientSecret)
  .then(token => {
    accessToken = token;
  })
  .catch(err => {
    console.error('Error fetching access token:', err);
  });

// Search route for albums, tracks, and artists
router.get('/search', (req, res) => {
  const { type, query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.send('Please enter a valid search query!');
  }

  // // Validate artist, album, track IDs
  // const { id } = req.query;
  // if (!/^[a-zA-Z0-9]{22}$/.test(id)) {  // Spotify ID format is typically 22 characters
  //   return res.send('Invalid ID format!');
  // }

  // const validator = require('validator');
  // if (!validator.isAlphanumeric(query)) {
  //   return res.send('Invalid query format!');
  // }

  if (!accessToken) {
    return res.status(500).send('Spotify access token not available. Try again later.');
  }

  const spotifyApi = new SpotifyApi(accessToken);

  if (type === 'album') {
    spotifyApi.searchAlbums(query, (err, albums) => {
      if (err) {
        return res.send('Error searching albums');
      }

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
        </header>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Search Results</title>
          <link rel="stylesheet" href="/web/css/styles.css">
        </head>
        <body>
          <h2>Search Results for Albums: "${query}"</h2>
          <table>
            <thead>
              <tr>
                <th>Album Cover</th>
                <th>Album Name</th>
                <th>Artist Name</th>
                <th>Release Date</th>
                <th>Number of Tracks</th>
              </tr>
            </thead>
            <tbody>`;

      albums.forEach(album => {
        const artist = album.artists && album.artists[0] ? album.artists[0] : { id: 'Unknown', name: 'Unknown Artist' };
        const imageUrl = album.images?.[0]?.url || '';
        html += `
          <tr>
            <td><img src="${imageUrl}" alt="Album Cover" width="50" height="50"></td>
            <td><a href="/web/album?id=${album.id}">${album.name}</a></td>
            <td><a href="/web/artist?id=${artist.id}">${artist.name}</a></td>
            <td>${album.release_date}</td>
            <td>${album.total_tracks}</td>
          </tr>
        `;
      });
            
      res.send(html);
    });
  } else if (type === 'track') {

    spotifyApi.searchTracks(query, (err, tracks) => {
      if (err) {
        return res.send('Error searching tracks');
      }

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
        </header>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Search Results for Tracks: "${query}"</title>
          <link rel="stylesheet" href="/web/css/styles.css">
        </head>
        <body>
          <h2>Search Results for Tracks: "${query}"</h2>
          <table>
            <thead>
              <tr>
                <th>Track Name</th>
                <th>Artist Name</th>
                <th>Album Name</th>
                <th>Duration</th>
                <th>Popularity</th>
              </tr>
            </thead>
            <tbody>`;

            tracks.forEach(track => {
              console.log("Track ID:", track.id); 
              console.log("Generated Track Link:", `/web/track?id=${track.id}`);
              html += `
                      <tr>
                        <td><a href="/web/track?id=${track.id}">${track.name}</a></td>
                        <td><a href="/web/artist?id=${track.artists[0].id}">${track.artists[0].name}</a></td>
                        <td><a href="/web/album?id=${track.album.id}">${track.album.name}</a></td>
                        <td>${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</td>
                        <td>${track.popularity}</td>
                      </tr>
              `;
          });            

    res.send(html);
    });
  } else if (type === 'artist') {
    spotifyApi.searchArtists(query, (err, artists) => {
      if (err) {
        return res.send('Error searching artists');
      }

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
        </header>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Search Results</title>
          <link rel="stylesheet" href="/web/css/styles.css">
        </head>
        <body>
          <h2>Search Results for Artists: "${query}"</h2>
          <table>
            <thead>
              <tr>
                <th>Artist Image</th>
                <th>Artist Name</th>
                <th>Genres</th>
                <th>Popularity</th>
                <th>Top Tracks</th>
              </tr>
            </thead>
            <tbody>`;

      artists.forEach(artist => {
        const artistId = artist.id || 'Unknown Artist ID';
        const artistName = artist.name || 'Unknown Artist';
        const imageUrl = artist.imageUrl || '';
        console.log('Artist ID:', artist.id);
        html += `
          <tr>
            <td><img src="${artist.imageUrl}" alt="Artist Image" width="50" height="50"></td>
            <td><a href="/web/artist?id=${artist.id}">${artist.name}</a></td>
            <td>${artist.genres.join(', ')}</td>
            <td>${artist.popularity}</td>
            <td><a href="/web/artist?id=${artist.id}">View Top Tracks</a></td>
          </tr>
        `;
      });

      res.send(html);
    });
  } else {
    res.send('Invalid search type!');
  }
});

// Route to serve album detail page
router.get('/album', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.send('Album ID is missing');
  }

  const spotifyApi = new SpotifyApi(accessToken);

  spotifyApi.getAlbum(id, (err, album) => {
    if (err) {
      return res.send('Error fetching album details');
    }

    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
      </header>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Album Details - ${album.name}</title>
        <link rel="stylesheet" href="/web/css/styles.css">
      </head>
      <body>
        <header>
          <h1>${album.name}</h1>
        </header>
        
        <section>
        <h2>Album Information</h2>
          <img src="${album.imageUrl}" alt="Album Cover" width="200">
          <p><strong>Release Date:</strong> ${new Date(album.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Genre(s):</strong> ${album.genres.join(', ')}</p>
          <p><strong>Artist(s):</strong> ${album.artists.map(artist => artist.name).join(', ')}</p>
          <p><strong>Number of Tracks:</strong> ${album.tracks.length}</p>
        </section>

        <section>
          <h2>Track List</h2>
          <ul>
            ${album.tracks.map(track => `
              <li><a href="/web/track?id=${track.trackId}">${track.name}</a> - ${track.artists[0].name}</li>
            `).join('')}
          </ul>
        </section>

        <section>
          <h2>Related Artists</h2>
          <ul>
            ${album.artists.map(artist => `
              <li><a href="/web/artist?id=${artist.id}">${artist.name}</a></li>
            `).join('')}
          </ul>
        </section>

        <section>
          <h2>Related Tracks</h2>
          <ul>
            ${album.tracks.map(track => `
              <li><a href="/web/track?id=${track.trackId}">${track.name}</a></li>
            `).join('')}
          </ul>
        </section>
      </body>
      </html>
    `;
    
    res.send(html); 
  });
});

router.get('/track', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.send('Track ID is missing');
  }

  const spotifyApi = new SpotifyApi(accessToken);

  spotifyApi.getTrack(id, (err, track) => {
    if (err) {
      console.error('Error fetching track:', err);
      return res.send('Error fetching track details');
    }

    if (!track || !track.name) {
      console.error('Track data is incomplete:', track);
      return res.send('Track data is missing or incomplete');
    }

    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
      </header>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Track Details - ${track.name}</title>
        <link rel="stylesheet" href="/web/css/styles.css">
      </head>
      <body>
        <header>
          <h1>${track.name}</h1>
        </header>
        
        <section>
        <h2>Track Information</h2>
          <p><strong>Artist(s):</strong> ${track.artists.map(artist => artist.name).join(', ')}</p>
          <p><strong>Album:</strong> <a href="/web/album?id=${track.albumId}">${track.albumId}</a></p>
          <p><strong>Duration:</strong> ${Math.floor(track.durationMs / 60000)}:${((track.durationMs % 60000) / 1000).toFixed(0).padStart(2, '0')}</p>
          <p><strong>Popularity:</strong> ${track.popularity}</p>
        </section>
      </body>
      </html>
    `;
    
    res.send(html);
  });
});

router.get('/artist', (req, res) => {
  const { id } = req.query;
  console.log('Artist ID from query string:', req.query.id);

  if (!id || !/^[a-zA-Z0-9]{22}$/.test(id)) {
    return res.send('Invalid or missing artist ID!');
  }

  const spotifyApi = new SpotifyApi(accessToken);
  spotifyApi.getArtist(id, (err, artist) => {
    if (err) {
      return res.send('Error fetching artist details');
    }

    const marketCode = req.query.market || 'US';
    spotifyApi.getArtistTopTracks(id, marketCode, (err, topTracks) => {
      if (err) {
        console.error('Error fetching top tracks for the artist:', err);
        return res.send('Error fetching top tracks');
      }

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
        </header>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Artist Details - ${artist.name}</title>
          <link rel="stylesheet" href="/web/css/styles.css">
        </head>
        <body>
          <header>
            <h1>${artist.name}</h1>
          </header>

          <section>
          <h2>Artist Information</h2>
            <img src="${artist.imageUrl}" alt="Artist Image" width="200">
            <p><strong>Genres:</strong> ${artist.genres.join(', ')}</p>
            <p><strong>Popularity:</strong> ${artist.popularity}</p>
            <p><strong>Followers:</strong> ${artist.followers.toLocaleString()}</p>
          </section>

          <section>
            <h2>Top Tracks</h2>
            <ul>
              ${topTracks.map(track => `
                <li>
                  <a href="/web/track?id=${track.trackId}">${track.name}</a> 
                  - ${track.artists.map(artist => artist.name).join(', ')}
                </li>
              `).join('')}
            </ul>
          </section>
        </body>
        </html>
      `;

      res.send(html);
    });
  });
});

// Custom 404 error page
router.use((req, res) => {
  res.status(404).send(`
    <html>
      <head><title>404 - Not Found</title></head>
      <body>
        <header>
          <h1>Spotify Search App</h1>
          <a href="/web/index.html">Back to Search</a>
        </header>
        <h2>404 - Page Not Found</h2>
        <p>The page you're looking for doesn't exist. Please check the URL or go back to the search page.</p>
        <a href="/web/index.html">Back to Search</a>
      </body>
    </html>
  `);
});

module.exports = router;
