// pages/api/portfolio.js
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "로그인이 필요해요." });
  const userId = session.user.id;

  const client = await clientPromise;
  const db = client.db("mystock");

  if (req.method === "GET") {
    const doc = await db.collection("portfolios").findOne({ userId });
    return res.status(200).json({ accounts: doc?.accounts || [], history: doc?.history || [] });
  }

  if (req.method === "POST") {
    const { accounts, history } = req.body;
    await db.collection("portfolios").updateOne(
      { userId },
      { $set: { userId, accounts: accounts || [], history: history || [], updatedAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
