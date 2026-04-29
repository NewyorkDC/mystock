// pages/api/admin.js
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongodb";

async function isAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return session?.user?.isAdmin === true;
}

export default async function handler(req, res) {
  if (!(await isAdmin(req, res))) {
    return res.status(403).json({ error: "관리자 권한이 없어요." });
  }

  const client = await clientPromise;
  const db = client.db("mystock");

  // GET: 전체 유저 목록
  if (req.method === "GET") {
    const portfolios = await db.collection("portfolios").find({}).toArray();
    const users = portfolios.map(p => ({
      userId: p.userId,
      accountCount: (p.accounts || []).length,
      stockCount: (p.accounts || []).flatMap(a => a.stocks || []).length,
      historyCount: (p.history || []).length,
      updatedAt: p.updatedAt,
    }));
    return res.status(200).json({ users });
  }

  // DELETE: 특정 유저 데이터 삭제
  if (req.method === "DELETE") {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId 필요" });
    await db.collection("portfolios").deleteOne({ userId });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
