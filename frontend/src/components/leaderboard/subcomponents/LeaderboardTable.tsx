import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import "../../../styles/leaderboard.css";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

interface LeaderboardTableProps {
  apiRoute: string;
  valueField: string;
  valueHeader: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  apiRoute,
  valueField,
  valueHeader
}) => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Leaderboard states
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);

  const fetchAnswerRateLeaderboard = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/leaderboard/${apiRoute}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
      if (!response.ok) throw new Error("Failed to fetch friends");

      const data = await response.json();
      console.log(data);

      setLeaderboardData(data.rowData);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswerRateLeaderboard();
  }, [loggedInUser]);

  const columnDefs: ColDef[] = [
    {
      headerName: "Rank",
      field: "rank",
      flex: 0.5,
      autoHeight: true,
      sortable: false,
      cellRenderer: (params: any) => {
        console.log(params);
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
      flex: 1,
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
      flex: 3,
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
      headerName: valueHeader,
      field: valueField,
      flex: 1,
      sortable: false
    }
  ];

  return (
    <div className="leaderboard-container">
      <div className="ag-theme-alpine">
        <AgGridReact
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100]}
          columnDefs={columnDefs}
          rowData={leaderboardData}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
};

export default LeaderboardTable;
