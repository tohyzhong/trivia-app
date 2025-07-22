import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import GameMainpage from "./GameMainpage";
import LobbyHandler from "./LobbyHandler";
import JoinLobbyHandler from "./JoinLobbyHandler";
import LobbyNotFound from "./gamelobby/LobbyNotFound";
import LobbyBrowser from "./LobbyBrowser";
import { setLobby } from "../../redux/lobbySlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setUser } from "../../redux/userSlice";

interface UserLobby {
  lobbyId: string;
  categories: string[];
  currency: number;
  powerups: {
    [key: string]: number;
  };
  status: string;
  chatBan: boolean;
}

const GameRoutes: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const lobby = useSelector((state: RootState) => state.lobby);

  useEffect(() => {
    if (!lobby.lobbyId) {
      const checkLobby = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/lobby/check`,
            {
              method: "GET",
              credentials: "include"
            }
          );

          const data: UserLobby = await res.json();

          if (!res.ok) {
            navigate("/settings");
            return;
          }

          if (data) {
            dispatch(
              setLobby({
                lobbyId: data.lobbyId,
                categories: data.categories,
                currency: data.currency,
                powerups: data.powerups,
                status: data.status
              })
            );

            dispatch(setUser({ ...user, chatBan: data.chatBan }));
          }

          if (data.lobbyId) {
            navigate(`/play/${data.lobbyId}`, { state: location.state });
          }
        } catch (error) {
          console.error("Error fetching lobby:", error);
        }
      };

      checkLobby();
    }
  }, [dispatch, navigate, location.state]);

  return (
    <>
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
