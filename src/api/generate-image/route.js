async function handler({ userId, prompt }) {
  if (!userId || !prompt) {
    return { error: "Missing required parameters" };
  }

  const tokenCheck = await sql`
    SELECT tokens FROM users 
    WHERE id = ${userId}
  `;

  if (!tokenCheck.length || tokenCheck[0].tokens < 1) {
    return { error: "Insufficient tokens" };
  }

  try {
    // Enhanced prompt for highest quality
    const enhancedPrompt = `Ultra high resolution 4K masterpiece, extremely detailed: ${prompt}`;

    const response = await fetch(`/integrations/dall-e-3/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        size: "1792x1024", // Requesting largest size
        quality: "hd", // Requesting HD quality
        style: "vivid", // For more detailed results
      }),
    });

    const result = await response.json();

    if (!result.data || !result.data[0]) {
      return { error: "Failed to generate image" };
    }

    const imageUrl = result.data[0];

    const [savedImage] = await sql.transaction([
      sql`
        UPDATE users 
        SET tokens = tokens - 1 
        WHERE id = ${userId}
        RETURNING tokens
      `,
      sql`
        INSERT INTO generated_images (user_id, prompt, image_url)
        VALUES (${userId}, ${prompt}, ${imageUrl})
        RETURNING id, image_url
      `,
    ]);

    return {
      imageUrl,
      remainingTokens: savedImage.tokens,
      success: true,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    return { error: "Failed to process request" };
  }
}
export async function POST(request) {
  return handler(await request.json());
      }
