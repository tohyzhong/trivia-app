import React from "react";
import "../../styles/homepage.css";

const AboutPage: React.FC = () => {
  return (
    <div className="home-container">
      <header>
        <h1>About The Rizz Quiz</h1>
      </header>
      <main>
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            In a world flooded with information overload and daily stress, The
            Rizz Quiz offers a fun, engaging way to take a break. Whether
            you&apos;re a teenager looking to escape school stress or an adult
            wanting a quick game break, we&apos;ve got something for you!
          </p>
          <br></br>
          <h2>Core Features</h2>
          <ul className="feature-list">
            <li>Track your progress across solo and multiplayer modes.</li>
            <li>Join different game modes: Solo, Co-op, and Versus.</li>
            <li>
              Leaderboard to compare your stats with friends and other players.
            </li>
            <li>
              Submit your own trivia questions and contribute to the game!
            </li>
            <li>Earn in-game currency to purchase power-ups.</li>
          </ul>
          <br></br>
          <h2>Why We Made It</h2>
          <p>
            Inspired by the internet meme culture and the need for stress
            relief, we wanted to create an app that not only entertains but also
            helps people stay connected over shared experiences. The Rizz Quiz
            is designed to let you test your meme knowledge, connect with
            friends, and enjoy a break from reality.
          </p>
        </section>
      </main>
      <footer>
        <p>&copy; 2025 The Rizz Quiz</p>
      </footer>
    </div>
  );
};

export default AboutPage;
