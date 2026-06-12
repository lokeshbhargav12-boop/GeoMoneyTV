import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateWeeklyReport, generateDailyReport } from '@/lib/newsletter-service'
import { 
  addNewsletterTask, 
  getNewsletterTask, 
  updateNewsletterTask,
  getPendingTasks
} from '@/lib/newsletter-queue'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Function to process tasks in the background
async function processNewsletterTask(taskId: string) {
  try {
    const task = getNewsletterTask(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    // Update task status to processing
    updateNewsletterTask(taskId, { status: 'processing' });
    
    console.log(`Processing newsletter task ${taskId} (${task.type})`);
    
    // Generate the report
    let subject: string;
    let htmlContent: string;
    
    if (task.type === 'daily') {
      ({ subject, htmlContent } = await generateDailyReport());
    } else {
      ({ subject, htmlContent } = await generateWeeklyReport());
    }
    
    // Update task with results
    updateNewsletterTask(taskId, { 
      status: 'completed',
      result: { subject, htmlContent }
    });
    
    console.log(`Successfully completed newsletter task ${taskId}`);
  } catch (error: any) {
    console.error(`Failed to process newsletter task ${taskId}:`, error);
    
    // Update task with error
    updateNewsletterTask(taskId, { 
      status: 'failed',
      error: error.message || 'Unknown error'
    });
  }
}

// Function to process all pending tasks
async function processPendingTasks() {
  const pendingTasks = getPendingTasks();
  
  for (const task of pendingTasks) {
    // In a real implementation, we'd use a proper queue system
    // For now, we'll process them one by one
    processNewsletterTask(task.id);
  }
}

// Set up periodic processing
setInterval(processPendingTasks, 10000); // Check every 10 seconds

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const type = body.type || 'weekly'

    // Create a new task in the queue
    const taskId = generateId();
    const task = addNewsletterTask({
      id: taskId,
      type,
      status: 'pending',
    });
    
    // Immediately return a response to prevent timeout
    return NextResponse.json({
      taskId,
      message: 'Newsletter generation started in background',
      status: 'pending',
    })
  } catch (error: any) {
    console.error('Newsletter generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start newsletter generation' }, { status: 500 })
  }
}

// Add a GET endpoint to check task status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }
    
    const task = getNewsletterTask(taskId);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // If task is still pending or processing, return current status
    if (task.status === 'pending' || task.status === 'processing') {
      return NextResponse.json({
        taskId,
        status: task.status,
        message: task.status === 'pending' ? 'Task queued for processing' : 'Task currently processing',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })
    }
    
    // If task is completed or failed, return the result
    return NextResponse.json({
      taskId,
      status: task.status,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })
  } catch (error: any) {
    console.error('Task status check error:', error)
    return NextResponse.json({ error: error.message || 'Failed to check task status' }, { status: 500 })
  }
}
