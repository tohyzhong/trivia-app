import React from "react";

interface Props {
  onClick: () => void;
  incoming: boolean;
  numFriends: number;
}

const ToggleButton: React.FC<Props> = (props) => {
  return (
    <a
      className="incoming-friend-requests-button"
      onClick={() => props.onClick()}
    >
      {props.incoming
        ? "Back to Friends List"
        : `Incoming Friend Requests (${props.numFriends})`}
    </a>
  );
};

export default ToggleButton;
