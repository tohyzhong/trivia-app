import React, { useEffect, useState } from "react";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import { useLocation } from "react-router-dom";

export const HomePage: React.FC = (props) => {
  // Error message display if redirected from another page after encountering an error
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>(
    location.state?.errorMessage || ""
  );

  return (
    <>
      <ErrorPopup message={errorMessage} setMessage={setErrorMessage} />
    </>
  );
};

export default HomePage;
