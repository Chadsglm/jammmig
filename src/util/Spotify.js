const clientID = '4615d3b46baa4f53942798b8a52a3570';
const redirectURI = 'https://jammming-spotify.herokuapp.com/';

let accessToken;

const Spotify = {
  getAccessToken() {
    if(accessToken) {
      return accessToken;
    }
    
    // check for access token Match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
      if (accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1]
        const expiresIn = Number(expiresInMatch[1])
        
        // This clears the parameters, allowing us to grab a new access token when it expires
        window.setTimeout(() => accessToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        } else {
        const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
          window.location = accessUrl;
        }
      },

    search(term) {
      const accessToken = Spotify.getAccessToken();
      return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(jsonResponse => {
          if (!jsonResponse.tracks) {
            return [];
          }
          return jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          }));
        });
    },

    savePlaylist(name, trackUris) {
      if (name && trackUris) {
        const accessToken = Spotify.getAccessToken();
        const headers = {
          Authorization: `Bearer ${accessToken}`
        };
        let userId;

        return fetch('https://api.spotify.com/v1/me', { headers: headers })
          .then(response => response.json())
          .then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
              headers: headers,
              method: 'POST',
              body: JSON.stringify({ name: name })
            })
              .then(response => response.json())
              .then(jsonResponse => {
                //Store playlist ID
                const playlistId = jsonResponse.id;

                return fetch(
                  `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
                  {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({ uris: trackUris })
                  }
                );
              });
          });
      } else {
        return;
      }
    }
  };


export default Spotify;
