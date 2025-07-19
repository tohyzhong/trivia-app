import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.jpg";
import "../../styles/friendslist.css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import ToggleButton from "./ToggleButton";
import { setError } from "../../redux/errorSlice";

interface Friend {
  username: string;
  profilePicture: string;
}

const FriendsList: React.FC = () => {
  const [renderIncoming, setRenderIncoming] = useState<boolean>(false);

  // Relevent usernames
  const { username } = useParams<{ username: string }>();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  // List data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingFriends, setIncomingFriends] = useState<Friend[]>([]);

  // Loading and error utils
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Fetching friends information
  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/${username}/all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mutual: true,
            incoming: loggedInUser === username
          })
        }
      );
      if (!response.ok) throw new Error("Failed to fetch friends");

      const data = await response.json();
      setFriends(data.mutual);
      setIncomingFriends(data.incoming);
    } catch (err) {
      dispatch(
        setError({ errorMessage: "Could not fetch friends", success: false })
      );
      console.error(err);
    }
  };

  useEffect(() => {
    if (!username || !loggedInUser) return; // Not loaded in
    if (renderIncoming && loggedInUser !== username) navigate("/noaccess"); // Deny access to view other people's incoming friend requests
    fetchFriends();
  }, [username, loggedInUser]);

  const handleButtonClick = () => {
    setRenderIncoming(!renderIncoming);
  };

  const addFriend = async (friendUsername: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/${loggedInUser}/add`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            friendUsername
          })
        }
      );

      if (!response.ok)
        throw new Error("Failed to accept incoming friend request");
      else {
        dispatch(
          setError({
            errorMessage: `You are now friends with ${friendUsername}`,
            success: true
          })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          errorMessage:
            "Unable to accept friend requests. Please reload the page.",
          success: false
        })
      );
      console.error(error);
    }
    fetchFriends(); // Reset friends info
  };

  const declineFriend = async (friendUsername: string) => {
    try {
      // Remove incoming friend relation
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/friends/${friendUsername}/remove`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            friendUsername: loggedInUser
          })
        }
      );

      if (!response.ok)
        throw new Error("Failed to decline incoming friend request");
      else {
        dispatch(
          setError({ errorMessage: "Friend request ignored.", success: true })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          errorMessage:
            "Unable to decline friend requests. Please reload the page.",
          success: false
        })
      );
      console.error(error);
    }
    fetchFriends(); // Reset friends info
  };

  const handleAccept = (friendUsername: string) => {
    addFriend(friendUsername);
  };

  const handleDecline = (friendUsername: string) => {
    declineFriend(friendUsername);
  };

  const columnDefs: ColDef[] = [
    {
      headerName: "Avatar",
      field: "profilePicture",
      flex: 1,
      autoHeight: true,
      sortable: false,
      resizable: false,
      cellRenderer: (params: any) => {
        const profilePic = params.value || defaultAvatar;
        return (
          <Link
            className="avatar-cell"
            to={`/profile/${params.data.username}`}
            style={{ width: "40px", height: "40px" }}
          >
            <img
              src={profilePic}
              alt={username}
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
              style={{
                borderRadius: "50%",
                width: "40px",
                height: "40px",
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
      sortable: true,
      resizable: false,
      filter: true,
      flex: 3,
      cellRenderer: (params: any) => {
        return (
          <Link
            to={`/profile/${params.data.username}`}
            style={{
              all: "unset"
            }}
          >
            <span className="username-link">{params.value}</span>
          </Link>
        );
      }
    },
    {
      headerName: "Actions",
      flex: 3,
      hide: !renderIncoming,
      sortable: false,
      resizable: false,
      cellRenderer: (params: any) => {
        return (
          <div className="actions-button-container">
            <button
              className="accept-button"
              onClick={() => handleAccept(params.data.username)}
            >
              Accept
            </button>
            <button
              className="decline-button"
              onClick={() => handleDecline(params.data.username)}
            >
              Decline
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="friendslist-container">
      <h2> {username}&apos;s Friends</h2>
      {loggedInUser === username && (
        <ToggleButton
          onClick={handleButtonClick}
          incoming={renderIncoming}
          numFriends={incomingFriends.length}
        />
      )}

      {(renderIncoming ? incomingFriends : friends).length === 0 ? (
        <p>
          You have{" "}
          {renderIncoming ? "no incoming friend requests" : "no friends yet."}
        </p>
      ) : (
        <div className="ag-theme-alpine">
          <AgGridReact
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[20, 50, 100]}
            columnDefs={columnDefs}
            rowData={renderIncoming ? incomingFriends : friends}
            domLayout="autoHeight"
          />
        </div>
      )}
    </div>
  );
};

export default FriendsList;
