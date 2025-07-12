import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import "./styles/App.css";

import useAuth from "./hooks/useAuth";

import NavigationBar from "./components/navigationbar/NavigationBar";
import ErrorPopup from "./components/authentication/subcomponents/ErrorPopup";

import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { useLobbySocketRedirect } from "./hooks/useLobbySocketRedirect";

const HomePage = lazy(() => import("./components/homepage/HomePage"));
const GameRoutes = lazy(() => import("./components/game/GameRoutes"));
const LeaderboardRoutes = lazy(
  () => import("./components/leaderboard/LeaderboardRoutes")
);
const SettingsRoutes = lazy(
  () => import("./components/settingspage/SettingsRoutes")
);
const AboutPage = lazy(() => import("./components/about/AboutPage"));
const Authentication = lazy(
  () => import("./components/authentication/Authentication")
);
const ProfileRoutes = lazy(
  () => import("./components/profilepage/ProfileRoutes")
);
const QuestionRequestRoutes = lazy(
  () => import("./components/questionrequest/QuestionRequestRoutes")
);
const ContactForm = lazy(() => import("./components/contact/ContactForm"));
const NoAccess = lazy(() => import("./components/noaccess/NoAccess"));

function App() {
  const isAuthChecked = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const verified = useSelector((state: RootState) => state.user.verified);
  const username = useSelector((state: RootState) => state.user.username);

  // Error popup
  const error = useSelector((state: RootState) => state.error.errorMessage);
  const isSuccess = useSelector((state: RootState) => state.error.success);
  const timestampKey = useSelector((state: RootState) => state.error.timestamp);

  const authFreeRoutes = [
    "/auth",
    "/about",
    "/settings/verify-action",
    "/contact"
  ];
  const verifiedFreeRoutes = authFreeRoutes.concat(["/settings"]);

  useEffect(() => {
    if (
      verified === false &&
      !verifiedFreeRoutes.some((route) =>
        location.pathname.startsWith(route)
      ) &&
      location.pathname !== "/"
    ) {
      navigate("/settings", { replace: true });
    }
  }, [verified, location.pathname, navigate]);

  useEffect(() => {
    if (
      username === undefined &&
      !authFreeRoutes.some((route) => location.pathname.startsWith(route)) &&
      location.pathname !== "/"
    ) {
      navigate("/auth/login?error=login_required", { replace: true });
    }
  }, [username, location.pathname, navigate]);

  useEffect(() => {
    const interval = setInterval(
      async () => {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/auth/ping`, {
            credentials: "include"
          });
        } catch (err) {
          console.error("User details ping failed", err);
        }
      },
      2 * 60 * 1000 // Check if user login cookie + redux email, verified, role match database records every 2 minutes and update if required
    );

    return () => clearInterval(interval);
  }, []);

  const loggedInUser = useSelector((state: RootState) => state.user.username);
  useLobbySocketRedirect(loggedInUser);

  const Components = [
    { component: HomePage, path: "/" },
    { component: GameRoutes, path: "/play/*" },
    { component: LeaderboardRoutes, path: "/leaderboard/*" },
    { component: SettingsRoutes, path: "/settings/*" },
    { component: AboutPage, path: "/about/*" },
    { component: Authentication, path: "/auth/*" },
    { component: ProfileRoutes, path: "/profile/*" },
    { component: QuestionRequestRoutes, path: "/question-request/*" },
    { component: ContactForm, path: "/contact/*" },
    { component: NoAccess, path: "/noaccess" },
    { component: NoAccess, path: "*" }
  ];

  if (!isAuthChecked) {
    return null;
  }

  return (
    <>
      {error && (
        <ErrorPopup key={timestampKey} message={error} success={isSuccess} />
      )}
      <NavigationBar />
      <Suspense fallback={<></>}>
        <Routes>
          {Components.map((comp) => {
            const ComponentName = comp.component;
            return (
              <Route
                key={comp.path}
                path={comp.path}
                element={<ComponentName />}
              />
            );
          })}
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
