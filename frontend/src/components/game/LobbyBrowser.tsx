import React, { useEffect, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import "../../styles/LobbyBrowser.css";

const LobbyBrowser: React.FC = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const gridRef = useRef<AgGridReact>(null);
  const navigate = useNavigate();

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
        setError(err.message);
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
          onClick={() => navigate(`/play/join/${params.data.lobbyId}`)}
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
      <h1>Multiplayer Lobby Browser</h1>
      <ErrorPopup message={error} setMessage={setError} />
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
