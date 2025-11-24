import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // AI가 이미지를 분석해 여행 관련 키워드를 한국어로 생성
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
You are analyzing a travel or daily life image.
Your task is to carefully examine the image and generate **8–12 short Korean keywords** that describe what you see AND the emotional experience.

### Important Guidelines:
First, identify the main subject of the image:
- **Food/Dining**: If it's a meal or food item, include taste/experience keywords that match the food type
  * Sweet desserts/drinks → "달콤했다", "행복했다"
  * Savory meals → "맛있었다", "배불렀다"
  * Fresh ingredients (e.g., lemon, vegetables) → "상큼했다", "신선했다" (NOT "맛있었다" for raw ingredients)
  * Special dining → "데이트", "특별한 날"

- **Scenery/Landscape**: If it's primarily nature or cityscape
  * Beautiful views → "멋있었다", "아름다웠다", "감동적이었다"
  * Peaceful nature → "평화로웠다", "힐링됐다"
  * Exciting cityscapes → "설렜다", "활기찼다"

- **Activities**: If people are doing something
  * Fun activities → "즐거웠다", "신났다"
  * Relaxing moments → "편안했다", "여유로웠다"

### Focus on these aspects:
- What is visible (objects, locations, activities)
- How it feels (emotions and sensations appropriate to the context)
- The atmosphere or mood
- Cultural or special moments

### Output format:
Return **only** a valid JSON object in this format:
{
  "keywords": ["키워드1", "키워드2", ...],
  "confidence": 0.95
}

### Requirements:
- All keywords **must be in Korean** (mix of nouns and emotional descriptors, e.g. "레몬", "상큼했다", "카페", "달콤했다")
- Include 3-5 emotional/experience keywords that **match the image content**
- Do **not** include generic food reactions for non-food items
- Do **not** include any explanations, comments, or text outside the JSON
              `,
            },
            {
              type: "image",
              image: imageData,
            },
          ],
        },
      ],
      maxTokens: 200,
    })

    // JSON 파싱
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      keywords: parsed.keywords || [],
      confidence: parsed.confidence || 0.8,
    })
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
