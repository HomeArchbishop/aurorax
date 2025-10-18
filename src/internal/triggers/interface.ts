import type { Pipeline } from '../pipelines'

export interface Trigger<E> {
  /**
   * Connect a pipeline to the trigger
   * @param pipeline The pipeline to connect to the trigger
   * @param branch The branch of the pipeline to connect to the trigger,
   *               each trigger implementation should handle the `branch` parameter differently.
   *               If not specified, the pipeline will be connected to all branches.
   */
  connect (pipeline: Pipeline<E>, branch?: string): void

  /**
   * Start the trigger
   */
  start (): void
}
