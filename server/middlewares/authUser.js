import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
    }
    

    req.userId = decoded.id; // Use req.userId (cleaner than req.body.userId)
    
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

export default authUser;







