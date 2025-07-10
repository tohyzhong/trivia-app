import React, { useEffect, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import "../../styles/LobbyBrowser.css";
import PauseOverlay from "./PauseOverlay";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import { playClickSound } from "../../utils/soundManager";
import SoundSettings from "./subcomponents/SoundSettings";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import { useDispatch } from "react-redux";
import { setError } from "../../redux/errorSlice";

const LobbyBrowser: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<AgGridReact>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/lobby/public`,
          {
            credentials: "include"
          }
        );
        const data = await res.json();

        if (!res.ok)
          throw new Error(data.message || "Failed to fetch lobbies.");

        setRowData(data.lobbies);
        setLoading(false);
      } catch (err) {
        dispatch(setError({ errorMessage: err.message, success: false }));
        setLoading(false);
      }
    };

    fetchLobbies();
  }, []);

  const columnDefs: ColDef[] = [
    {
      headerName: "Lobby Name",
      field: "gameSettings.name",
      sortable: true,
      filter: true,
      flex: 1.5,
      cellRenderer: (params: any) => (
        <span
          style={{ color: "#3498db", cursor: "pointer" }}
          onClick={() => {
            navigate(`/play/join/${params.data.lobbyId}`);
            playClickSound();
          }}
        >
          {params.value || `${params.data.host}'s Lobby`}
        </span>
      )
    },
    {
      headerName: "Host",
      field: "host",
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: "Players",
      valueGetter: (params: any) =>
        Object.keys(params.data.players || {}).length,
      sortable: true,
      filter: true,
      flex: 0.8
    },
    {
      headerName: "Game Type",
      field: "gameType",
      sortable: true,
      filter: true,
      flex: 1
    },
    {
      headerName: "Questions",
      field: "gameSettings.numQuestions",
      sortable: true,
      filter: true,
      flex: 0.8
    },
    {
      headerName: "Time",
      field: "gameSettings.timePerQuestion",
      sortable: true,
      filter: true,
      flex: 0.8
    },
    {
      headerName: "Difficulty",
      field: "gameSettings.difficulty",
      sortable: true,
      filter: true,
      flex: 0.8
    },
    {
      headerName: "Categories",
      valueGetter: (params: any) =>
        (params.data.gameSettings.categories || []).join(", "),
      sortable: true,
      filter: true,
      flex: 2
    }
  ];

  return (
    <div className="lobby-browser-container">
      <>
        {bgmBlocked && <PauseOverlay onResume={handleResume} />}
        <IoSettingsOutline
          onClick={() => {
            playClickSound();
            setIsSoundPopupOpen(true);
          }}
          className="sound-settings-icon"
        />
        <p className="hover-text-2 sound-settings-icon-text">Sound Settings</p>

        {isSoundPopupOpen && (
          <div className="sound-settings-popup">
            <IoClose
              className="submode-select-close"
              onClick={() => {
                playClickSound();
                setIsSoundPopupOpen(false);
              }}
            />
            <SoundSettings />
          </div>
        )}
      </>

      <h1>Multiplayer Lobby Browser</h1>
      {!loading && rowData && rowData.length >= 1 ? (
        <div className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={rowData}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[20, 50, 100]}
            domLayout="autoHeight"
          />
        </div>
      ) : (
        <h3 style={{ color: "White" }}>No Lobbies Found</h3>
      )}
    </div>
  );
};

export default LobbyBrowser;
