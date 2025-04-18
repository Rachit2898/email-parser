import jwt from "jsonwebtoken";
import Token from "./Model/Token.js";
import config from "./config.json" assert { type: "json" };

/**
 * Parses JWT token and checks if it is expired.
 * @param {string} token - JWT access token.
 * @returns {boolean} - Returns `true` if expired, otherwise `false`.
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error("Invalid token structure");
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTimestamp;
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return true;
  }
}

async function checkAndRefreshToken(locationId) {
  try {
    const tokenDoc = await Token.findOne({ locationId });

    if (!tokenDoc) {
      throw new Error("Token not found for the given location.");
    }

    const accessToken = tokenDoc.access_token;

    if (isTokenExpired(accessToken)) {
      console.log("Token expired, refreshing...");
      const encodedParams = new URLSearchParams();
      encodedParams.set("client_id", config.clientId);
      encodedParams.set("client_secret", config.clientSecret);
      encodedParams.set("grant_type", "refresh_token");
      encodedParams.set("refresh_token", tokenDoc.refresh_token);
      encodedParams.set("redirect_uri", "http://localhost:8000/");

      const url = "https://services.leadconnectorhq.com/oauth/token";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: encodedParams,
      };

      const response = await fetch(url, options);
      const data = await response.json();

      if (!data.access_token || !data.refresh_token) {
        throw new Error("Failed to refresh tokens.");
      }

      const decodedNewToken = jwt.decode(data.access_token);
      if (!decodedNewToken || !decodedNewToken.exp) {
        throw new Error("Invalid token structure - missing expiration time.");
      }
      const expiresAt = new Date(decodedNewToken.exp * 1000);
      tokenDoc.access_token = data.access_token;
      tokenDoc.refresh_token = data.refresh_token;
      tokenDoc.expires_at = expiresAt;
      await tokenDoc.save();

      console.log(`Token refreshed successfully. New expiry: ${expiresAt}`);
      return data.access_token;
    } else {
      return accessToken;
    }
  } catch (error) {
    console.error("Error in token validation:", error.message);
    throw new Error("Failed to validate or refresh token.");
  }
}

export async function validateToken(req, res, next) {
  try {
    const locationId = "lXqUG5UDmVTUwxr7W0HQ";

    if (!locationId) {
      return res.status(400).json({ error: "locationId is required." });
    }

    const accessToken = await checkAndRefreshToken(locationId);
    req.locationId = locationId;
    req.token = accessToken;

    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

export async function validate() {
  try {
    const locationId = "lXqUG5UDmVTUwxr7W0HQ";
    if (!locationId) {
      return { error: "locationId is required." };
    }
    const accessToken = await checkAndRefreshToken(locationId);
    return {
      locationId,
      accessToken,
    };
  } catch (error) {
    return { error: error.message };
  }
}
