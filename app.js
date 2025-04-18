import express from "express";
import { connectDB } from "./config/db.js";
import { upsertContact } from "./controllers/ghl.js";
import { validate } from "./util.js";
import { MailListener } from "mail-listener5";

const app = express();
app.use(express.json());

app.use("/",(req,res)=>{
  res.status(200).json({success:"true"})
})

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
// Handle uncaught exceptions (sync)
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Handle unhandled promise rejections (async)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

try {
  connectDB();
} catch (err) {
  console.error("DB connection error:", err);
}

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ---------------- Email Listener Setup ----------------

const mailListener = new MailListener({
  username: "david.lonsdale436@gmail.com",
  password: "pmpy xiuf jyqo jyfn",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  mailbox: "INBOX",
  // searchFilter: [
  //   "UNSEEN",
  //   ["FROM", "merachit2898@gmail.com"],
  //   ["SUBJECT", "Buyer interested in your"],
  // ],
   searchFilter: ["UNSEEN", ["SUBJECT", "Buyer interested in your"]],
  markSeen: true,
  fetchUnreadOnStart: true,
  attachments: false,
  tlsOptions: { rejectUnauthorized: false },
});

mailListener.start();

mailListener.on("server:connected", () => {
  console.log("Mail listener connected and waiting for new mail...");
});

mailListener.on("error", (err) => {
  console.error("Mail listener error:", err);
});

function generateRandomPhoneNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

mailListener.on("mail", async (mail) => {
  try {
    const fromAddress = mail.from[0].address;
    if (!fromAddress.endsWith("@leads.rvtrader.com")) {
      console.log("Skipped mail from:", fromAddress);
      return;
    }
    const body = mail.text || mail.html || "";
    const cleanedBody = body.replace(/\s+/g, " ");
    const titleMatch = cleanedBody.match(
      /A buyer is interested in your (.+?) and has sent you the message below/i
    );
    const title = titleMatch?.[1]?.trim();

    const titleParts = title.split(" ");
    const year = titleParts[0];
    const make = titleParts[1];
    const series = titleParts[2];
    const trim = titleParts.slice(3).join(" ");

    const name = body.match(/Name:\s*(.*)/)?.[1]?.trim();
    const phone = body.match(/Phone:\s*(.*)/)?.[1]?.trim();
    const price = body.match(/Price:\s*\$?([\d,]+)/)?.[1]?.trim();
    const adId = body.match(/Ad ID:\s*(\d+)/)?.[1]?.trim();
    const messageMatch = body.match(
      /Message from buyer\s*(.*?)(?=Listing Details)/is
    );
    let message = messageMatch?.[1]?.trim() || "";
    message = message
      .replace(/\*/g, "")
      .replace(/-{2,}/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const extractedData = {
      name,
      phone,
      price,
      adId,
      message,
      year,
      make,
      series,
      trim,
    };

    console.log(extractedData);

    if (!name) throw new Error("Name not found in email");

    let nameCleaned = name.replace(/\*/g, "").trim();
    let [firstName = "", lastName = ""] = nameCleaned.split(" ");

    const token = await validate();

    const customFields = [
      {
        id: "Zb0fXPpLbSyY8v1lwa3z",
        field_value: message,
      },
      {
        id: "b9fot60B0ktW9zkQR3jb",
        field_value: year,
      },
      {
        id: "Fd36NgrIl0gKQ0PdhJff",
        field_value: make,
      },
      {
        id: "Z9xLI66ilbof3OrHzcnT",
        field_value: series,
      },
      {
        id: "Y2YDKU6WJmh9FexPgIH0",
        field_value: trim,
      },
      {
        id: "CtMvy9UPWGgMeMKB1KIG",
        field_value: price,
      },
    ];
    //Remove generate function and email only for testing
    const ghlContactsUpsertRequestPayload = {
      body: {
        firstName,
        lastName,
        name: nameCleaned,
        customFields,
        locationId: "lXqUG5UDmVTUwxr7W0HQ",
        phone: phone.toLowerCase().includes("not provided")
          ? generateRandomPhoneNumber()
          : phone.replace(/\D/g, ""),
      },
      token: token.accessToken,
      locationId: token.locationId,
    };
    await upsertContact(ghlContactsUpsertRequestPayload);
  } catch (error) {
    console.error("Error handling incoming mail:", error);
  }
});
