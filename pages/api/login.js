import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "@/utils/auth/session";

export default withIronSessionApiRoute(async (req, res) => {
  try {
    const user = JSON.parse(Buffer.from(req.body, 'base64').toString());
    const userData = user.auth.currentUser

    if (userData) {
      req.session.user = {
        displayName: userData.displayName,
        token: userData.stsTokenManager.accessToken,
        ext: userData.stsTokenManager.expirationTime,
        isLoggedIn: true,
        uid: userData.uid,
        imageUrl: userData.photoURL,
      }

      await req.session.save();

      res.json({
        isLoggedIn: true,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}, sessionOptions);
