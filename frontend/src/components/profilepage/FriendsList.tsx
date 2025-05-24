import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useNavigate, useParams } from 'react-router-dom';
import defaultAvatar from '../../assets/default-avatar.jpg';
import '../../styles/friendslist.css';

interface Friend {
  id: number;
  username: string;
  profilePicture: string;
}

const FriendsList: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/${username}/friends`);
        if (!response.ok) throw new Error('Failed to fetch friends');

        const data = await response.json();
        setFriends(data);
      } catch (err) {
        setError('Could not fetch friends');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [username]);

  if (error) return <div className="not-found">{error}</div>;

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
          < img
            src={profilePic}
            alt={username}
            onError={e => (e.currentTarget.src = defaultAvatar)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }}
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
            onClick={() => navigate(`/profile/${params.data.username}`)}  // Navigate on click
          >
            {params.value}
          </span>
        );
      },
    }
  ];

  return (
    <div className="friendslist-container">
      < h2 > {username}'s Friends</h2>

      {
        friends.length === 0 ? (
          <p>{username} has no friends yet.</p>
        ) : (
          <div className="ag-theme-alpine">
            <AgGridReact
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[20, 50, 100]}
              columnDefs={columnDefs}
              rowData={friends}
              domLayout="autoHeight"
            />
          </div>
        )
      }
    </div >
  );
};

export default FriendsList;