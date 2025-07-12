import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/homepage.css";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const HomePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const location = useLocation();

  return (
    <>
      <div className="home-container">
        <header>
          <h1>The Rizz Quiz</h1>
          <p>Welcome to The Rizz Quiz!</p>
          <p>
            The ultimate trivia game that lets you test your knowledge of meme
            culture. Whether you want to play solo, compete with friends, or
            team up for co-op challenges, there's something for everyone.
          </p>
          <p>
            Track your stats, earn rewards, and climb the leaderboard. Let’s see
            who’s the ultimate meme master!
          </p>
        </header>
        <main>
          <section className="game-modes">
            <h2>Game Modes</h2>
            <div className="modes">
              <div className="mode">
                <h3>Solo Mode</h3>
                <p>Play alone and test your meme knowledge!</p>
                <Link to="/play" className="button">
                  Play Now
                </Link>
              </div>
              <div className="mode">
                <h3>Co-op Mode</h3>
                <p>Team up with friends for a fun co-op experience.</p>
                <Link to="/play" className="button">
                  Play Now
                </Link>
              </div>
              <div className="mode">
                <h3>Versus Mode</h3>
                <p>Compete head-to-head against other players!</p>
                <Link to="/play" className="button">
                  Play Now
                </Link>
              </div>
            </div>
          </section>

          {!user.isAuthenticated && (
            <section className="progress">
              <h2>Calling All Rizzlers!</h2>
              <p>
                Unlock your inner meme lord! Only legends with accounts can play
                and flex their trivia skills.
              </p>
              <p>Sign up or log in to join the Rizzolution!</p>
              <Link to="/auth/signup" className="get-started-button">
                Get Started
              </Link>
            </section>
          )}
        </main>
        <footer>
          <p>&copy; 2025 The Rizz Quiz</p>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
