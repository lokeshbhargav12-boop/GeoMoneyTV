import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        const lowerPrompt = prompt.toLowerCase();

        let path = '/';
        let message = 'Navigating to Home...';

        if (lowerPrompt.includes('admin') || lowerPrompt.includes('dashboard')) {
            path = '/admin';
            message = 'Navigating to Admin Dashboard...';
        } else if (lowerPrompt.includes('settings')) {
            path = '/admin/settings';
            message = 'Navigating to Settings...';
        } else if (lowerPrompt.includes('news') || lowerPrompt.includes('article') || lowerPrompt.includes('intel')) {
            let searchTerm = '';
            const commandWords = ['show', 'me', 'news', 'about', 'articles', 'on', 'find', 'search', 'for', 'the', 'latest', 'get', 'go', 'to', 'open'];
            const promptWords = lowerPrompt.split(' ');

            const relevantWords = promptWords.filter((w: string) => !commandWords.includes(w));
            if (relevantWords.length > 0) {
                searchTerm = relevantWords.join(' ');
            }

            path = '/news';
            message = searchTerm ? `Showing news about "${searchTerm}"...` : 'Navigating to News...';
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
        } else {
            // Default: go to news
            message = "I'll take you to the News section for the latest intel.";
            path = '/news';
        }

        return NextResponse.json({ path, message });

    } catch (error) {
        console.error('AI Navigation Error:', error);
        return NextResponse.json({ error: 'Failed to process navigation request' }, { status: 500 });
    }
}
