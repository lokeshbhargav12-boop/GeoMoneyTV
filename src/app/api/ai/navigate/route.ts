import { NextResponse } from 'next/server';

const COMMAND_WORDS = new Set([
  'show', 'me', 'news', 'about', 'articles', 'on', 'find', 'search', 'for',
  'the', 'latest', 'get', 'go', 'to', 'open', 'please', 'give', 'any', 'all',
  'some', 'a', 'an', 'of', 'in', 'and', 'with', 'please', 'tell', 'what',
]);

function extractSearchTerm(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[?!.,;:"'()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !COMMAND_WORDS.has(w));
  return words.join(' ').trim();
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Please enter a navigation request.' },
        { status: 400 }
      );
    }

    const lowerPrompt = prompt.toLowerCase();

    let path = '/';
    let message = 'Navigating to Home...';
    let search: string | null = null;

    if (lowerPrompt.includes('admin') || lowerPrompt.includes('dashboard')) {
      path = '/admin';
      message = 'Navigating to Admin Dashboard...';
    } else if (lowerPrompt.includes('settings')) {
      path = '/admin/settings';
      message = 'Navigating to Settings...';
    } else if (
      lowerPrompt.includes('news') ||
      lowerPrompt.includes('article') ||
      lowerPrompt.includes('intel') ||
      lowerPrompt.includes('headline')
    ) {
      const searchTerm = extractSearchTerm(prompt);
      search = searchTerm || null;
      path = searchTerm ? `/news?search=${encodeURIComponent(searchTerm)}` : '/news';
      message = searchTerm
        ? `Showing news about "${searchTerm}"...`
        : 'Navigating to News...';
    } else if (lowerPrompt.includes('video') || lowerPrompt.includes('youtube') || lowerPrompt.includes('watch')) {
      path = '/videos';
      message = 'Navigating to Videos...';
    } else if (lowerPrompt.includes('short') || lowerPrompt.includes('shorts')) {
      path = '/videos';
      message = 'Navigating to YouTube Shorts...';
    } else if (lowerPrompt.includes('tool') || lowerPrompt.includes('calculator') || lowerPrompt.includes('convert') || lowerPrompt.includes('grade') || lowerPrompt.includes('npv')) {
      path = '/tools';
      message = 'Navigating to Tools & Calculators...';
    } else if (lowerPrompt.includes('energy') || lowerPrompt.includes('solar') || lowerPrompt.includes('wind') || lowerPrompt.includes('renewable') || lowerPrompt.includes('clean energy') || lowerPrompt.includes('hydrogen') || lowerPrompt.includes('nuclear energy') || lowerPrompt.includes('lithium') || lowerPrompt.includes('carbon offset') || lowerPrompt.includes('geothermal')) {
      path = '/energy';
      message = 'Navigating to Energy Hub...';
    } else if (lowerPrompt.includes('rare earth') || lowerPrompt.includes('mineral') || lowerPrompt.includes('material') || lowerPrompt.includes('element')) {
      path = '/materials';
      message = 'Navigating to Rare Earth Materials...';
    } else if (lowerPrompt.includes('newsletter') || lowerPrompt.includes('subscribe')) {
      path = '/features/newsletter';
      message = 'Navigating to Newsletter...';
    } else if (lowerPrompt.includes('analytics') || lowerPrompt.includes('data') || lowerPrompt.includes('tracker')) {
      path = '/features/analytics';
      message = 'Navigating to Analytics Dashboard...';
    } else if (lowerPrompt.includes('app') || lowerPrompt.includes('mobile')) {
      path = '/features/app';
      message = 'Navigating to GeoMoney App...';
    } else if (lowerPrompt.includes('weekly') || lowerPrompt.includes('brief') || lowerPrompt.includes('report')) {
      path = '/features/weekly-brief';
      message = 'Navigating to The GeoMoney Intelligence Report...';
    } else if (lowerPrompt.includes('login') || lowerPrompt.includes('sign in')) {
      path = '/auth/signin';
      message = 'Navigating to Login...';
    } else if (lowerPrompt.includes('register') || lowerPrompt.includes('sign up')) {
      path = '/auth/register';
      message = 'Navigating to Register...';
    } else if (lowerPrompt.includes('pricing') || lowerPrompt.includes('plan') || lowerPrompt.includes('membership') || lowerPrompt.includes('subscribe')) {
      path = '/pricing';
      message = 'Navigating to Pricing & Access...';
    } else {
      // Treat a plain question as a news search so the assistant always
      // does something useful instead of dropping the user on a bare feed.
      const searchTerm = extractSearchTerm(prompt);
      if (searchTerm) {
        search = searchTerm;
        path = `/news?search=${encodeURIComponent(searchTerm)}`;
        message = `Showing news about "${searchTerm}"...`;
      } else {
        message = "I'll take you to the News section for the latest intel.";
        path = '/news';
      }
    }

    return NextResponse.json({ path, message, search });
  } catch (error) {
    console.error('AI Navigation Error:', error);
    return NextResponse.json(
      { error: 'Failed to process navigation request' },
      { status: 500 }
    );
  }
}
