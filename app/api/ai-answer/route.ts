import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function POST(req: Request) {
    console.log(
  "API KEY EXISTS:",
  !!process.env.GEMINI_API_KEY
);
  try {
    const { question } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(
      `
Answer the question in less than 80 words.

Use simple English.

Do not use markdown.
Do not use *, #, bullets, or headings.

Question:
${question}
`
    );

    const answer = result.response.text();

    return Response.json({
      answer,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Failed to generate answer",
      },
      {
        status: 500,
      }
    );
  }
}