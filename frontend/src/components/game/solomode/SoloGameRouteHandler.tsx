import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'
import { RootState } from '../../../redux/store';
import GameLoading from '../gamelobby/GameLoading';
import GameLobby from '../gamelobby/GameLobby';

const SoloGameRouteHandler = () => {
  // Loading state
  const [ loading, setLoading ] = useState<boolean>(true);

  // Access check variables
  const { lobbyId } = useParams();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  const navigate = useNavigate();
  const checkAccess = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/solo/${lobbyId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ player: loggedInUser }),
        });
      const data = await response.json();

      if (response.ok) {
        console.log(data);
        setLoading(false);
      } else {
        navigate('/',{ state: { errorMessage: data.message || '' } });
      }

    } catch (error) {
      navigate('/',{ state: { errorMessage: 'Error fetching lobby details. Contact support if you believe this is an error.' } });
    }
  }

  // Check player's access to lobby after the variables are loaded in
  useEffect(() => {
    if (lobbyId && loggedInUser) {
      checkAccess();
    }
  }, [lobbyId, loggedInUser])

  return (loading ? (<GameLoading />) : (<GameLobby />))
}

export default SoloGameRouteHandler