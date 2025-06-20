import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        verified: decoded.verified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authenticate;
