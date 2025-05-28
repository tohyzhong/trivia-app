import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useNavigate, useParams } from 'react-router-dom';
import defaultAvatar from '../../assets/default-avatar.jpg';
import '../../styles/friendslist.css';

interface Friend {
  username: string;
  profilePicture: string;
}

interface Props {
  incoming: boolean; // Conditionally render incoming friend requests instead
}

const FriendsList: React.FC<Props> = (props) => {
  const renderIncoming = props.incoming;
  const { username } = useParams<{ username: string }>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingFriends, setIncomingFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  // Fetching mutual friends
  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${username}/mutual`,
        {
          credentials: 'include',
        });
      if (!response.ok) throw new Error('Failed to fetch friends');

      const data = await response.json();
      setFriends(data);
    } catch (err) {
      setError('Could not fetch friends');
    } finally {
      setLoading(false);
    }
  };

  // Fetching incoming friends
  const fetchIncomingFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${username}/incoming`,
        {
          credentials: 'include',
        });
      if (!response.ok) throw new Error('Failed to fetch friends');

      const data = await response.json();
      setIncomingFriends(data);
    } catch (err) {
      setError('Could not fetch friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return; // Not loaded in
    fetchIncomingFriends();
    fetchFriends();
  }, [username]);

  if (error) return <div className="not-found">{error}</div>;

  const handleButtonClick = () => {
    if (renderIncoming) navigate(`/profile/${username}/friends`);
    else navigate(`/profile/${username}/friendrequests`);
  }

  // TODO: Accept/Decline button for incoming friends
  // TODO: Deny access to view other people's friends list
  // TODO: Separate button into a different component, render conditionally (viewing own friends vs. other people's friends)

  const columnDefs: ColDef[] = [
    {
      headerName: 'Profile Picture',
      field: 'profilePicture',
      width: 200,
      autoHeight: true,
      sortable: false,
      cellRenderer: (params: any) => {
        const profilePic = params.value || defaultAvatar;
        return (
          <img
            src={profilePic}
            alt={username}
            onError={e => (e.currentTarget.src = defaultAvatar)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }}
            onClick={() => navigate(`/profile/${params.data.username}`)}
          />
        )
      }
    },
    {
      headerName: 'Username',
      field: 'username',
      flex: 1,
      cellRenderer: (params: any) => {
        return (
          <span
            className="username-link"
            onClick={() => navigate(`/profile/${params.data.username}`)}
          >
            {params.value}
          </span>
        );
      },
    }
  ];

  return (
    <div className="friendslist-container">
      <h2> {username}'s Friends</h2>
      
      <a className='incoming-friend-requests-button' onClick={handleButtonClick}>
        {renderIncoming ? "Back to Friends List" : "Incoming Friend Requests"}
      </a>
      {
        (renderIncoming ? incomingFriends : friends).length === 0 ? (
          <p>You have {renderIncoming ? "no incoming friend requests" : "no friends yet."}</p>
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
        )      }
    </div>
  );
};

export default FriendsList;