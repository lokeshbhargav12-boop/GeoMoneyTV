import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: Request) {
    try {
        const { articleId } = await req.json();

        if (!articleId) {
            return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
        }

        // Get the article
        const article = await prisma.article.findUnique({
            where: { id: articleId },
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // If we already have an AI summary, return it
        if (article.aiSummary) {
            return NextResponse.json({
                summary: article.aiSummary,
                cached: true,
            });
        }

        // Check if content is truncated
        const content = article.content || '';
        const isTruncated =
            content.trim().match(/\[\+\d+ chars\]$/) ||
            content.trim().endsWith('...') ||
            content.length < 300;

        if (!isTruncated && content.length > 500) {
            // Content is already good
            return NextResponse.json({
                summary: null,
                cached: false,
                reason: 'Content is complete',
            });
        }

        const prompt = `
      You are a senior geopolitical and financial journalist writing for GeoMoney TV.
      
      I have a news article that was cut off / truncated. Based on the title, description, and whatever content is available, write a COMPLETE, PROFESSIONAL, DETAILED article.
      
      Title: ${article.title}
      Description: ${article.description || 'N/A'}
      Available Content: ${content.substring(0, 3000)}
      Source: ${article.sourceName || 'N/A'}
      Category: ${article.category}
      
      INSTRUCTIONS:
      - Write a complete 400-600 word article covering this topic thoroughly
      - Use a professional, analytical tone fitting a geopolitical intelligence publication
      - Include relevant context, background, and implications
      - Focus on geopolitical, financial, and strategic angles
      - Structure with clear paragraphs
      - Do NOT include a title or heading — just the article body text
      - Do NOT use markdown formatting, bullet points, or headers — just flowing paragraphs
      - Be factual and analytical, avoid sensationalism
      
      Write the article now:
    `;

        const { content: aiSummary } = await callOpenRouter(prompt, {
            temperature: 0.3,
            maxTokens: 900,
            caller: 'summarize',
        });

        if (!aiSummary?.trim()) {
            throw new Error('No content received from AI');
        }

        // Store the AI summary in the database
        await prisma.article.update({
            where: { id: articleId },
            data: { aiSummary },
        });

        return NextResponse.json({
            summary: aiSummary,
            cached: false,
        });

    } catch (error) {
        console.error('AI Summary Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
