import React, { useEffect, useRef, useState } from "react";
import { ColDef, SortDirection } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import "../../../styles/leaderboard.css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import LeaderboardPodium from "./LeaderboardPodium";
import { setError } from "../../../redux/errorSlice";
import { Link } from "react-router-dom";

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
  correctRate?: number;
  wonMatches?: number;
  totalMatches?: number;
  winRate?: number;
  rank: number;
  score: number;
}

const LeaderboardTable: React.FC<Props> = ({ gameFormat, mode, category }) => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<RowData[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);
  const [sortField, setSortField] = useState<string>("correctAnswer");
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const gridRef = useRef<any>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (gridApi) {
      const sortModel = gridApi.getColumnState();
      sortModel[3].sort = "desc";
      gridApi.applyColumnState({
        state: sortModel,
        applyOrder: true
      });
    }
  }, [gridApi]);

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
            total === 0 ? -1 : parseFloat(((correct / total) * 100).toFixed(2));

          let winRate: number | undefined = undefined;
          if (
            (category === "Overall" || category === "Community") &&
            typeof entry.wonMatches === "number" &&
            typeof entry.totalMatches === "number"
          ) {
            winRate =
              entry.totalMatches === 0
                ? -1
                : parseFloat(
                    ((entry.wonMatches / entry.totalMatches) * 100).toFixed(2)
                  );
          }

          return { ...entry, correctRate, winRate };
        });

        setRawData(withRate);
        updateRanks(withRate);
      } catch (err: any) {
        dispatch(setError({ errorMessage: err.message, success: false }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameFormat, mode, category]);

  const updateRanks = (data: RowData[], field: string = "correctAnswer") => {
    const sortedDesc = [...data].sort((a, b) => {
      return b[field] - a[field];
    });

    sortedDesc.forEach((entry, idx) => (entry.rank = idx + 1));

    const sortedByRank = [...sortedDesc].sort((a, b) => a.rank - b.rank);

    setRowData(sortedByRank);
    setSortField(field);
  };

  const onSortChanged = (event: any) => {
    const api = event.api;
    const sortModel = api.getColumnState().find((col: any) => col.sort);
    if (!sortModel) return updateRanks(rowData);

    const colId = sortModel.colId;

    updateRanks(rawData, colId);
  };

  const columnDefs: ColDef[] = [
    {
      headerName: "Rank",
      field: "rank",
      flex: 0.5,
      autoHeight: true,
      sortable: false,
      resizable: false,
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
      resizable: false,
      cellRenderer: (params: any) => {
        const profilePic = params.value || defaultAvatar;
        return (
          <Link
            to={`/profile/${params.data.username}`}
            style={{
              width: "40px",
              height: "40px"
            }}
          >
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
            />
          </Link>
        );
      }
    },
    {
      headerName: "Username",
      field: "username",
      sortable: false,
      resizable: false,
      filter: true,
      flex: 1.5,
      cellRenderer: (params: any) => {
        return (
          <Link
            to={`/profile/${params.data.username}`}
            style={{ all: "unset" }}
          >
            <span
              className="username-link"
              style={
                params.value === loggedInUser
                  ? { fontWeight: "bold", color: "lightblue" }
                  : undefined
              }
            >
              {params.value} {params.value === loggedInUser ? "(You)" : ""}
            </span>
          </Link>
        );
      }
    },
    {
      headerName: "Correct",
      field: "correctAnswer",
      flex: 0.6,
      sortable: true,
      resizable: false,
      sortingOrder: ["desc"]
    },
    {
      headerName: "Total",
      field: "totalAnswer",
      flex: 0.6,
      sortable: true,
      resizable: false,
      sortingOrder: ["desc"]
    },
    {
      headerName: "Correct %",
      field: "correctRate",
      flex: 0.6,
      sortable: true,
      resizable: false,
      sortingOrder: ["desc"],
      valueFormatter: (params) =>
        params.value === -1 || params.value === undefined
          ? "N.A."
          : params.value.toFixed(2) + "%"
    },
    ...((category === "Overall" || category === "Community") &&
    (mode === "Overall" || mode === "Versus")
      ? [
          {
            headerName: "Wins",
            field: "wonMatches",
            flex: 0.6,
            sortable: true,
            resizable: false,
            sortingOrder: ["desc"] as SortDirection[]
          },
          {
            headerName: "Matches",
            field: "totalMatches",
            flex: 0.6,
            sortable: true,
            resizable: false,
            sortingOrder: ["desc"] as SortDirection[]
          },
          {
            headerName: "Win %",
            field: "winRate",
            flex: 0.6,
            sortable: true,
            resizable: false,
            sortingOrder: ["desc"] as SortDirection[],
            valueFormatter: (params) =>
              params.value === -1 || params.value === undefined
                ? "N.A."
                : params.value.toFixed(2) + "%"
          },
          {
            headerName: "Score",
            field: "score",
            flex: 0.6,
            sortable: true,
            resizable: false,
            sortingOrder: ["desc"] as SortDirection[],
            valueFormatter: (params) =>
              params.value === undefined
                ? 0
                : params.value.toLocaleString("en-US")
          }
        ]
      : category === "Overall" || category === "Community"
        ? [
            {
              headerName: "Score",
              field: "score",
              flex: 0.6,
              sortable: true,
              resizable: false,
              sortingOrder: ["desc"] as SortDirection[],
              valueFormatter: (params) =>
                params.value === undefined
                  ? 0
                  : params.value.toLocaleString("en-US")
            }
          ]
        : [])
  ];

  return (
    <div className="leaderboard-container">
      {!loading && rowData && (
        <LeaderboardPodium
          podiumData={rowData
            .filter((entry) => entry.rank <= 3)
            .sort((a, b) => a.rank - b.rank)}
          sortField={sortField}
        />
      )}
      {!loading && rowData && (
        <div className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            onGridReady={(params) => {
              setGridApi(params.api);
            }}
            columnDefs={columnDefs}
            rowData={rowData}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[20, 50, 100]}
            domLayout="autoHeight"
            onSortChanged={onSortChanged}
            multiSortKey={null}
          />
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
