// Shared newsletter queue for managing background tasks
export interface NewsletterTask {
  id: string;
  type: 'daily' | 'weekly';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: { subject: string; htmlContent: string };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory queue (in production, use Redis or database)
let newsletterQueue: NewsletterTask[] = [];

export const getNewsletterQueue = () => newsletterQueue;

export const addNewsletterTask = (task: Omit<NewsletterTask, 'createdAt' | 'updatedAt'>): NewsletterTask => {
  const newTask: NewsletterTask = {
    ...task,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  newsletterQueue.push(newTask);
  return newTask;
};

export const getNewsletterTask = (taskId: string): NewsletterTask | undefined => {
  return newsletterQueue.find(task => task.id === taskId);
};

export const updateNewsletterTask = (taskId: string, updates: Partial<NewsletterTask>): boolean => {
  const index = newsletterQueue.findIndex(task => task.id === taskId);
  if (index === -1) return false;
  
  const task = newsletterQueue[index];
  newsletterQueue[index] = {
    ...task,
    ...updates,
    updatedAt: new Date(),
  };
  
  return true;
};

export const removeNewsletterTask = (taskId: string): boolean => {
  const index = newsletterQueue.findIndex(task => task.id === taskId);
  if (index === -1) return false;
  
  newsletterQueue.splice(index, 1);
  return true;
};

export const getPendingTasks = (): NewsletterTask[] => {
  return newsletterQueue.filter(task => task.status === 'pending');
};