import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import "./styles/App.css";

import useAuth from "./hooks/useAuth";

import NavigationBar from "./components/navigationbar/NavigationBar";

import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

import { SpeedInsights } from "@vercel/speed-insights/react";

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
const NoAccess = lazy(() => import("./components/noaccess/NoAccess"));

function App() {
  const isAuthChecked = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const verified = useSelector((state: RootState) => state.user.verified);
  const username = useSelector((state: RootState) => state.user.username);

  const authFreeRoutes = ["/auth", "/about", "/settings/verify-action"];
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

  const Components = [
    { component: HomePage, path: "/" },
    { component: GameRoutes, path: "/play/*" },
    { component: LeaderboardRoutes, path: "/leaderboard/*" },
    { component: SettingsRoutes, path: "/settings/*" },
    { component: AboutPage, path: "/about" },
    { component: Authentication, path: "/auth/*" },
    { component: ProfileRoutes, path: "/profile/*" },
    { component: QuestionRequestRoutes, path: "/question-request/*" },
    { component: NoAccess, path: "/noaccess" },
    { component: NoAccess, path: "*" }
  ];

  if (!isAuthChecked) {
    return null;
  }

  return (
    <>
      <>
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
      <SpeedInsights />
    </>
  );
}

export default App;
