async function handler({ userId, action, amount }) {
  if (action === "create") {
    const [user] = await sql`
      INSERT INTO users DEFAULT VALUES
      RETURNING id, tokens
    `;
    return { userId: user.id, tokens: user.tokens };
  }

  if (action === "get") {
    const [user] = await sql`
      SELECT tokens FROM users
      WHERE id = ${userId}
    `;
    return user ? { tokens: user.tokens } : null;
  }

  if (action === "update") {
    const [user] = await sql`
      UPDATE users
      SET tokens = tokens + ${amount}
      WHERE id = ${userId}
      RETURNING tokens
    `;
    return user ? { tokens: user.tokens } : null;
  }

  return null;
}
export async function POST(request) {
  return handler(await request.json());
}
