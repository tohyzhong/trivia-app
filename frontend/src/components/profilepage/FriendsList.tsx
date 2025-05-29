import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useNavigate, useParams } from 'react-router-dom';
import defaultAvatar from '../../assets/default-avatar.jpg';
import '../../styles/friendslist.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

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
  const loggedInUser = useSelector((state: RootState) => state.user.username);
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
    if (!username || !loggedInUser) return; // Not loaded in
    if (renderIncoming && (loggedInUser !== username)) navigate('/noaccess'); // Deny access to view other people's incoming friend requests
    fetchIncomingFriends();
    fetchFriends();
  }, [username, loggedInUser, renderIncoming]);

  if (error) return <div className="not-found">{error}</div>;

  const handleButtonClick = () => {
    if (renderIncoming) navigate(`/profile/${username}/friends`);
    else navigate(`/profile/${username}/friendrequests`);
  }

  // TODO: Accept/Decline button for incoming friends
  const addFriend = async (friendUsername: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${loggedInUser}/add`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          friendUsername
        }),
      });
      
      if (!response.ok) throw new Error('Failed to accept incoming friend request');
      else alert(`You are now friends with ${friendUsername}`)
    } catch (error) {
      setError('Unable to accept friend requests. Please reload the page.');
    } finally {
      setLoading(false);
    }
    window.location.reload();
  }

  const declineFriend = async (friendUsername: string) => {
    try {
      // Remove incoming friend relation
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends/${friendUsername}/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          friendUsername: loggedInUser
        }),
      });

      if (!response.ok) throw new Error('Failed to decline incoming friend request');
      else alert('Friend request ignored.')
    } catch (error) {
      setError('Unable to decline friend requests. Please reload the page.')
    } finally {
      setLoading(false);
    }
    window.location.reload();
  }

  const handleAccept = (friendUsername: string) => {
    addFriend(friendUsername);
  }

  const handleDecline = (friendUsername: string) => {
    declineFriend(friendUsername);
  }
  // TODO: Deny access to view other people's friends list
  // TODO: Separate button into a different component, render conditionally (viewing own friends vs. other people's friends)

  const columnDefs: ColDef[] = [
    {
      headerName: 'Avatar',
      field: 'profilePicture',
      flex: 1,
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
      flex: 3,
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
    },
    {
      headerName: 'Actions',
      flex: 3,
      hide: !renderIncoming,
      sortable: false,
      cellRenderer: (params: any) => {
        return (
          <div className='actions-button-container'>
            <button className='accept-button' onClick={() => handleAccept(params.data.username)}>Accept</button>
            <button className='decline-button' onClick={() => handleDecline(params.data.username)}>Decline</button>
          </div>
        )
      }
    }
  ];

  return (
    <div className="friendslist-container">
      <h2> {username}'s Friends</h2>
      { 
        loggedInUser == username ? (
        <a className='incoming-friend-requests-button' onClick={handleButtonClick}>
          {renderIncoming ? "Back to Friends List" : `Incoming Friend Requests (${incomingFriends.length})`}
        </a>
        ) : <></> 
      }

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