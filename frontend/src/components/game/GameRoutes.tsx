import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import GameMainpage from "./GameMainpage";
import LobbyHandler from "./LobbyHandler";
import JoinLobbyHandler from "./JoinLobbyHandler";
import LobbyNotFound from "./gamelobby/LobbyNotFound";
import LobbyBrowser from "./LobbyBrowser";
import { setCurrency, setLobby } from "../../redux/lobbySlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import CurrencyBar from "./subcomponents/CurrencyBar";

const GameRoutes: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const lobby = useSelector((state: RootState) => state.lobby);

  useEffect(() => {
    if (!lobby.lobbyId) {
      // No lobby in redux, check if user in lobby
      fetch(`${import.meta.env.VITE_API_URL}/api/lobby/check`, {
        method: "GET",
        credentials: "include"
      })
        .then((response) => response.json())
        .then((data) => {
          dispatch(
            setLobby({
              lobbyId: data.lobbyId,
              categories: data.categories,
              currency: data.currency,
              powerups: data.powerups,
              status: data.status
            })
          );

          if (data.lobbyId) {
            navigate(`/play/${data.lobbyId}`, { state: location.state });
          }
        })
        .catch((error) => {
          console.error("Error fetching lobby:", error);
        });
    }
  }, [dispatch, navigate, location.state]);

  return (
    <>
      <CurrencyBar />
      <Routes>
        {lobby.lobbyId && <Route path="/:lobbyId" element={<LobbyHandler />} />}
        <Route path="/join/:lobbyId" element={<JoinLobbyHandler />} />
        <Route path="/lobbies" element={<LobbyBrowser />} />
        <Route path="/:lobbyId" element={<LobbyNotFound />} />
        <Route path="/*" element={<GameMainpage />} />
      </Routes>
    </>
  );
};

export default GameRoutes;
