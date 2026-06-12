// Background processor for newsletter generation tasks
// This script should be run as a separate process or scheduled task

// Import the shared queue module
const { getPendingTasks, updateNewsletterTask, getNewsletterTask } = require('../src/lib/newsletter-queue');

// Process pending tasks
async function processNewsletterQueue() {
  console.log('Checking newsletter queue for pending tasks...');
  
  // Find pending tasks
  const pendingTasks = getPendingTasks();
  
  if (pendingTasks.length === 0) {
    console.log('No pending tasks found');
    return;
  }
  
  console.log(`Found ${pendingTasks.length} pending tasks`);
  
  // Process each pending task
  for (const task of pendingTasks) {
    try {
      console.log(`Processing newsletter task ${task.id} (${task.type})`);
      
      // Import here to avoid issues with module loading
      const { generateWeeklyReport, generateDailyReport } = require('../src/lib/newsletter-service');
      
      // Update task status to processing
      updateNewsletterTask(task.id, { status: 'processing' });
      
      // Generate the report
      let subject, htmlContent;
      
      if (task.type === 'daily') {
        ({ subject, htmlContent } = await generateDailyReport());
      } else {
        ({ subject, htmlContent } = await generateWeeklyReport());
      }
      
      // Update task with results
      updateNewsletterTask(task.id, { 
        status: 'completed',
        result: { subject, htmlContent }
      });
      
      console.log(`Successfully completed newsletter task ${task.id}`);
    } catch (error) {
      console.error(`Failed to process newsletter task ${task.id}:`, error);
      
      // Update task with error
      updateNewsletterTask(task.id, { 
        status: 'failed',
        error: error.message || 'Unknown error'
      });
    }
  }
}

// Run the processor periodically
setInterval(processNewsletterQueue, 10000); // Check every 10 seconds

console.log('Newsletter queue processor started');

// Export for use in other modules if needed
module.exports = { processNewsletterQueue };
