declare module 'markdown-it-task-lists' {
  import type { PluginWithOptions } from 'markdown-it';

  export type TaskListOptions = {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  };

  const taskLists: PluginWithOptions<TaskListOptions>;
  export default taskLists;
}
