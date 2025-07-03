import React, { useEffect, useRef, useState } from "react";
import { ColDef, SortDirection } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { data, useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import "../../../styles/leaderboard.css";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import LeaderboardPodium from "./LeaderboardPodium";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";

interface Props {
  gameFormat: string;
  mode: string;
  category: string;
}

interface RowData {
  username: string;
  profilePicture: string;
  correctAnswer: number;
  totalAnswer: number;
  correctRate?: string;
  wonMatches?: number;
  totalMatches?: number;
  winRate?: string;
  rank: number;
  score: string;
}

const LeaderboardTable: React.FC<Props> = ({ gameFormat, mode, category }) => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<RowData[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState<string>("correctAnswer");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const gridRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/leaderboard/stats?gameFormat=${gameFormat}&mode=${mode.toLowerCase().replace("-", "")}&category=${category === "Overall" ? "overall" : category}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          }
        );
        const data = await res.json();
        const withRate = data.map((entry: RowData) => {
          const correct = entry.correctAnswer;
          const total = entry.totalAnswer;
          const correctRate =
            total === 0 ? "0.00%" : `${((correct / total) * 100).toFixed(2)}%`;

          let winRate: string | undefined = undefined;
          if (
            (category === "Overall" || category === "Community") &&
            typeof entry.wonMatches === "number" &&
            typeof entry.totalMatches === "number"
          ) {
            winRate =
              entry.totalMatches === 0
                ? "0.00%"
                : `${((entry.wonMatches / entry.totalMatches) * 100).toFixed(2)}%`;
          }

          return { ...entry, correctRate, winRate };
        });
        setRawData(withRate);
        updateRanks(withRate);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameFormat, mode, category]);

  const updateRanks = (
    data: RowData[],
    field: string = "correctAnswer",
    asc: boolean = false
  ) => {
    const sortedDesc = [...data].sort((a, b) => {
      const aVal =
        field === "correctRate" || field === "winRate"
          ? parseFloat(a[field])
          : field === "score"
            ? parseInt(a[field])
            : a[field];
      const bVal =
        field === "correctRate" || field === "winRate"
          ? parseFloat(b[field])
          : field === "score"
            ? parseInt(b[field])
            : b[field];
      return bVal - aVal;
    });

    sortedDesc.forEach((entry, idx) => (entry.rank = idx + 1));

    const sortedByRank = [...sortedDesc].sort((a, b) => a.rank - b.rank);

    setRowData(sortedByRank);
    setSortField(field);
    setSortAsc(asc);
  };

  const onSortChanged = (event: any) => {
    const api = event.api;
    const sortModel = api.getColumnState().find((col: any) => col.sort);
    if (!sortModel) return updateRanks(rowData);

    const colId = sortModel.colId;
    const sortAsc = sortModel.sort === "asc";

    updateRanks(rawData, colId, sortAsc);
  };

  const columnDefs: ColDef[] = [
    {
      headerName: "Rank",
      field: "rank",
      flex: 0.5,
      autoHeight: true,
      sortable: false,
      cellRenderer: (params: any) => {
        return (
          <strong>
            <span>
              {params.value === 1
                ? "🥇 "
                : params.value === 2
                  ? "🥈 "
                  : params.value === 3
                    ? "🥉 "
                    : ""}
            </span>
            {params.value}
          </strong>
        );
      }
    },
    {
      headerName: "Avatar",
      field: "profilePicture",
      flex: 0.5,
      autoHeight: true,
      sortable: false,
      cellRenderer: (params: any) => {
        const profilePic = params.value || defaultAvatar;
        return (
          <img
            src={profilePic}
            alt={"test"}
            onError={(e) => (e.currentTarget.src = defaultAvatar)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              objectFit: "cover"
            }}
            onClick={() => navigate(`/profile/${params.data.username}`)}
          />
        );
      }
    },
    {
      headerName: "Username",
      field: "username",
      sortable: false,
      flex: 1.5,
      cellRenderer: (params: any) => {
        return (
          <span
            className="username-link"
            onClick={() => navigate(`/profile/${params.data.username}`)}
            style={
              params.value === loggedInUser
                ? { fontWeight: "bold", color: "lightblue" }
                : undefined
            }
          >
            {params.value} {params.value === loggedInUser ? "(You)" : ""}
          </span>
        );
      }
    },
    {
      headerName: "Correct",
      field: "correctAnswer",
      flex: 0.6,
      sortable: true,
      sortingOrder: ["desc", "asc"]
    },
    {
      headerName: "Total",
      field: "totalAnswer",
      flex: 0.6,
      sortable: true,
      sortingOrder: ["desc", "asc"]
    },
    {
      headerName: "Correct %",
      field: "correctRate",
      flex: 0.6,
      sortable: true,
      sortingOrder: ["desc", "asc"]
    },
    ...(category === "Overall" || category === "Community"
      ? [
          {
            headerName: "Wins",
            field: "wonMatches",
            flex: 0.6,
            sortable: true,
            sortingOrder: ["desc", "asc"] as SortDirection[]
          },
          {
            headerName: "Matches",
            field: "totalMatches",
            flex: 0.6,
            sortable: true,
            sortingOrder: ["desc", "asc"] as SortDirection[]
          },
          {
            headerName: "Win %",
            field: "winRate",
            flex: 0.6,
            sortable: true,
            sortingOrder: ["desc", "asc"] as SortDirection[]
          },
          {
            headerName: "Score",
            field: "score",
            flex: 0.6,
            sortable: true,
            sortingOrder: ["desc", "asc"] as SortDirection[]
          }
        ]
      : [])
  ];

  return (
    <div className="leaderboard-container">
      <ErrorPopup message={error} setMessage={setError} />
      {!loading && rowData && (
        <LeaderboardPodium
          podiumData={rowData
            .filter((entry) => entry.rank <= 3)
            .sort((a, b) => a.rank - b.rank)}
          sortField={sortField}
        />
      )}
      <div className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100]}
          domLayout="autoHeight"
          onSortChanged={onSortChanged}
        />
      </div>
    </div>
  );
};

export default LeaderboardTable;
